using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;
using CalorieTracker.Api.Domain.ValueObjects;
using Npgsql;

namespace CalorieTracker.Api.Infrastructure.Postgres;

/// <summary>Каталог продуктов: репозиторий на чистом SQL через Npgsql.</summary>
internal sealed class SqlProductRepository(NpgsqlDataSource dataSource) : IProductRepository
{
    private const string Columns = "p.id, p.name, p.calories, p.protein, p.fat, p.carbs, c.name";

    public async Task<Product?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var command = dataSource.CreateCommand(
            $"""
            SELECT {Columns}
            FROM products p
            LEFT JOIN product_categories c ON c.id = p.category_id
            WHERE p.id = @id AND p.is_catalog
            """);
        command.Parameters.AddWithValue("id", id);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadProduct(reader) : null;
    }

    public async Task<PagedResult<Product>> GetPagedAsync(
        Pagination pagination,
        CancellationToken cancellationToken = default)
    {
        var total = await CountAsync(cancellationToken);

        await using var command = dataSource.CreateCommand(
            $"""
            SELECT {Columns}
            FROM products p
            LEFT JOIN product_categories c ON c.id = p.category_id
            WHERE p.is_catalog
            ORDER BY lower(p.name), p.id
            LIMIT @take OFFSET @skip
            """);
        command.Parameters.AddWithValue("take", pagination.PageSize);
        command.Parameters.AddWithValue("skip", pagination.Skip);

        var items = new List<Product>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(ReadProduct(reader));
        }

        return new PagedResult<Product>(items, pagination.Page, pagination.PageSize, total);
    }

    public async Task AddAsync(Product product, CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        var categoryId = await UpsertCategoryAsync(connection, transaction, product.Category, cancellationToken);

        await using var command = new NpgsqlCommand(
            """
            INSERT INTO products (id, name, category_id, calories, protein, fat, carbs, is_catalog)
            VALUES (@id, @name, @category, @calories, @protein, @fat, @carbs, true)
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("id", product.Id);
        command.Parameters.AddWithValue("name", product.Name.Value);
        command.Parameters.AddWithValue("category", (object?)categoryId ?? DBNull.Value);
        command.Parameters.AddWithValue("calories", product.Calories);
        command.Parameters.AddWithValue("protein", product.Protein);
        command.Parameters.AddWithValue("fat", product.Fat);
        command.Parameters.AddWithValue("carbs", product.Carbs);
        await command.ExecuteNonQueryAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);
    }

    public async Task<int> CountAsync(CancellationToken cancellationToken = default)
    {
        await using var command = dataSource.CreateCommand(
            "SELECT count(*) FROM products WHERE is_catalog");
        var result = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt32(result);
    }

    /// <summary>Находит категорию по названию или создаёт её; null — продукт без категории.</summary>
    internal static async Task<int?> UpsertCategoryAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        string? category,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(category))
        {
            return null;
        }

        await using var command = new NpgsqlCommand(
            """
            INSERT INTO product_categories (name) VALUES (@name)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("name", category.Trim());
        return (int)(await command.ExecuteScalarAsync(cancellationToken))!;
    }

    /// <summary>
    /// Читает продукт из семи подряд идущих столбцов:
    /// id, name, calories, protein, fat, carbs, category (offset — номер первого).
    /// </summary>
    internal static Product ReadProduct(NpgsqlDataReader reader, int offset = 0) =>
        Product.Create(
            ProductName.Create(reader.GetString(offset + 1)),
            NutritionFacts.Create(
                reader.GetDouble(offset + 2),
                reader.GetDouble(offset + 3),
                reader.GetDouble(offset + 4),
                reader.GetDouble(offset + 5)),
            reader.IsDBNull(offset + 6) ? null : reader.GetString(offset + 6),
            reader.GetGuid(offset));
}
