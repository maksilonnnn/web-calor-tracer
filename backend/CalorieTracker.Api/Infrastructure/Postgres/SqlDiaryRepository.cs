using CalorieTracker.Api.Domain.Common;
using CalorieTracker.Api.Domain.Entities;
using CalorieTracker.Api.Domain.Repositories;
using CalorieTracker.Api.Domain.ValueObjects;
using Npgsql;

namespace CalorieTracker.Api.Infrastructure.Postgres;

/// <summary>
/// Дневник питания: репозиторий на чистом SQL через Npgsql.
/// Продукты внутри позиций хранятся как «снимки» (products.is_catalog = false).
/// </summary>
internal sealed class SqlDiaryRepository(NpgsqlDataSource dataSource) : IDiaryRepository
{
    private const string LoadSql =
        """
        SELECT e.id, e.user_id, e.entry_date, m.meal_type, i.id, i.quantity_grams,
               p.id, p.name, p.calories, p.protein, p.fat, p.carbs, c.name
        FROM diary_entries e
        LEFT JOIN meals m ON m.diary_entry_id = e.id
        LEFT JOIN meal_items i ON i.meal_id = m.id
        LEFT JOIN products p ON p.id = i.product_id
        LEFT JOIN product_categories c ON c.id = p.category_id
        WHERE e.id = ANY(@ids)
        ORDER BY e.id, i.position
        """;

    public async Task<DiaryEntry?> FindAsync(
        Guid userId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

        await using var command = new NpgsqlCommand(
            "SELECT e.id FROM diary_entries e WHERE e.user_id = @user AND e.entry_date = @date",
            connection);
        command.Parameters.AddWithValue("user", userId);
        command.Parameters.AddWithValue("date", date);

        var id = await command.ExecuteScalarAsync(cancellationToken);
        if (id is not Guid entryId)
        {
            return null;
        }

        var entries = await LoadAsync(connection, [entryId], cancellationToken);
        return entries.FirstOrDefault();
    }

    public async Task<DiaryEntry> GetOrCreateAsync(
        Guid userId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        var existing = await FindAsync(userId, date, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var created = DiaryEntry.CreateEmpty(userId, date);
        await SaveAsync(created, cancellationToken);
        return await FindAsync(userId, date, cancellationToken) ?? created;
    }

    public async Task<DiaryEntry?> FindByItemIdAsync(
        Guid userId,
        Guid itemId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

        await using var command = new NpgsqlCommand(
            """
            SELECT e.id
            FROM meal_items i
            JOIN meals m ON m.id = i.meal_id
            JOIN diary_entries e ON e.id = m.diary_entry_id
            WHERE i.id = @item AND e.user_id = @user
            """,
            connection);
        command.Parameters.AddWithValue("item", itemId);
        command.Parameters.AddWithValue("user", userId);

        var id = await command.ExecuteScalarAsync(cancellationToken);
        if (id is not Guid entryId)
        {
            return null;
        }

        var entries = await LoadAsync(connection, [entryId], cancellationToken);
        return entries.FirstOrDefault();
    }

    public async Task<IReadOnlyList<DiaryEntry>> GetAllForUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

        await using var command = new NpgsqlCommand(
            "SELECT e.id FROM diary_entries e WHERE e.user_id = @user ORDER BY e.entry_date DESC",
            connection);
        command.Parameters.AddWithValue("user", userId);

        var ids = await ReadIdsAsync(command, cancellationToken);
        return await LoadAsync(connection, ids, cancellationToken);
    }

    public async Task<PagedResult<DiaryEntry>> GetHistoryPageAsync(
        Guid userId,
        Pagination pagination,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

        await using var countCommand = new NpgsqlCommand(
            "SELECT count(*) FROM diary_entries e WHERE e.user_id = @user",
            connection);
        countCommand.Parameters.AddWithValue("user", userId);
        var total = Convert.ToInt32(await countCommand.ExecuteScalarAsync(cancellationToken));

        await using var pageCommand = new NpgsqlCommand(
            """
            SELECT e.id
            FROM diary_entries e
            WHERE e.user_id = @user
            ORDER BY e.entry_date DESC
            LIMIT @take OFFSET @skip
            """,
            connection);
        pageCommand.Parameters.AddWithValue("user", userId);
        pageCommand.Parameters.AddWithValue("take", pagination.PageSize);
        pageCommand.Parameters.AddWithValue("skip", pagination.Skip);

        var ids = await ReadIdsAsync(pageCommand, cancellationToken);
        var entries = await LoadAsync(connection, ids, cancellationToken);
        return new PagedResult<DiaryEntry>(entries, pagination.Page, pagination.PageSize, total);
    }

    public async Task SaveAsync(DiaryEntry entry, CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        // 1. Запись дня (одна на пользователя и дату).
        await ExecuteAsync(
            connection,
            transaction,
            """
            INSERT INTO diary_entries (id, user_id, entry_date)
            VALUES (@id, @user, @date)
            ON CONFLICT DO NOTHING
            """,
            cancellationToken,
            ("id", entry.Id),
            ("user", entry.UserId),
            ("date", entry.Date));

        await using var idCommand = new NpgsqlCommand(
            "SELECT e.id FROM diary_entries e WHERE e.user_id = @user AND e.entry_date = @date",
            connection,
            transaction);
        idCommand.Parameters.AddWithValue("user", entry.UserId);
        idCommand.Parameters.AddWithValue("date", entry.Date);
        var entryId = (Guid)(await idCommand.ExecuteScalarAsync(cancellationToken))!;

        // 2. Четыре приёма пищи на день.
        await ExecuteAsync(
            connection,
            transaction,
            """
            INSERT INTO meals (diary_entry_id, meal_type)
            SELECT @entry, t
            FROM unnest(ARRAY['breakfast', 'lunch', 'dinner', 'snack']) AS t
            ON CONFLICT DO NOTHING
            """,
            cancellationToken,
            ("entry", entryId));

        // 3. Позиции: снимок продукта + сама позиция.
        var keep = new List<Guid>();
        foreach (var meal in entry.Meals)
        {
            foreach (var item in meal.Items)
            {
                keep.Add(item.Id);
                var product = item.Product;
                var categoryId = await SqlProductRepository.UpsertCategoryAsync(
                    connection, transaction, product.Category, cancellationToken);

                // Обновляются только снимки; запись каталога этим запросом не меняется.
                await ExecuteAsync(
                    connection,
                    transaction,
                    """
                    INSERT INTO products (id, name, category_id, calories, protein, fat, carbs, is_catalog)
                    VALUES (@id, @name, @category, @calories, @protein, @fat, @carbs, false)
                    ON CONFLICT (id) DO UPDATE
                    SET name = EXCLUDED.name,
                        category_id = EXCLUDED.category_id,
                        calories = EXCLUDED.calories,
                        protein = EXCLUDED.protein,
                        fat = EXCLUDED.fat,
                        carbs = EXCLUDED.carbs
                    WHERE products.is_catalog = false
                    """,
                    cancellationToken,
                    ("id", product.Id),
                    ("name", product.Name.Value),
                    ("category", (object?)categoryId ?? DBNull.Value),
                    ("calories", product.Calories),
                    ("protein", product.Protein),
                    ("fat", product.Fat),
                    ("carbs", product.Carbs));

                await ExecuteAsync(
                    connection,
                    transaction,
                    """
                    INSERT INTO meal_items (id, meal_id, product_id, quantity_grams)
                    VALUES (
                        @id,
                        (SELECT m.id FROM meals m WHERE m.diary_entry_id = @entry AND m.meal_type = @type),
                        @product,
                        @quantity)
                    ON CONFLICT (id) DO UPDATE
                    SET product_id = EXCLUDED.product_id,
                        quantity_grams = EXCLUDED.quantity_grams
                    """,
                    cancellationToken,
                    ("id", item.Id),
                    ("entry", entryId),
                    ("type", DbEnums.ToDb(meal.Type)),
                    ("product", product.Id),
                    ("quantity", item.Quantity.Value));
            }
        }

        // 4. Удалённые позиции.
        await ExecuteAsync(
            connection,
            transaction,
            """
            DELETE FROM meal_items i
            USING meals m
            WHERE i.meal_id = m.id
              AND m.diary_entry_id = @entry
              AND NOT (i.id = ANY(@keep))
            """,
            cancellationToken,
            ("entry", entryId),
            ("keep", keep.ToArray()));

        await DeleteOrphanSnapshotsAsync(connection, transaction, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    public async Task RemoveAllForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        await ExecuteAsync(
            connection,
            transaction,
            "DELETE FROM diary_entries WHERE user_id = @user",
            cancellationToken,
            ("user", userId));

        await DeleteOrphanSnapshotsAsync(connection, transaction, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    private static Task DeleteOrphanSnapshotsAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        CancellationToken cancellationToken) =>
        ExecuteAsync(
            connection,
            transaction,
            """
            DELETE FROM products p
            WHERE NOT p.is_catalog
              AND NOT EXISTS (SELECT 1 FROM meal_items i WHERE i.product_id = p.id)
            """,
            cancellationToken);

    private static async Task<List<Guid>> ReadIdsAsync(
        NpgsqlCommand command,
        CancellationToken cancellationToken)
    {
        var ids = new List<Guid>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            ids.Add(reader.GetGuid(0));
        }

        return ids;
    }

    /// <summary>Загружает записи дней целиком (приёмы пищи, позиции, продукты), сохраняя порядок ids.</summary>
    private static async Task<IReadOnlyList<DiaryEntry>> LoadAsync(
        NpgsqlConnection connection,
        IReadOnlyList<Guid> ids,
        CancellationToken cancellationToken)
    {
        if (ids.Count == 0)
        {
            return [];
        }

        var entries = new Dictionary<Guid, DiaryEntry>();

        await using var command = new NpgsqlCommand(LoadSql, connection);
        command.Parameters.AddWithValue("ids", ids.ToArray());

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var entryId = reader.GetGuid(0);
            if (!entries.TryGetValue(entryId, out var entry))
            {
                entry = DiaryEntry.CreateEmpty(
                    reader.GetGuid(1),
                    reader.GetFieldValue<DateOnly>(2),
                    entryId);
                entries[entryId] = entry;
            }

            if (reader.IsDBNull(4))
            {
                continue; // день без позиций
            }

            var item = MealItem.Create(
                SqlProductRepository.ReadProduct(reader, 6),
                GramAmount.Create(reader.GetDouble(5)),
                reader.GetGuid(4));
            entry.AddItem(DbEnums.MealTypeFromDb(reader.GetString(3)), item);
        }

        return ids.Where(entries.ContainsKey).Select(id => entries[id]).ToList();
    }

    private static async Task ExecuteAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        string sql,
        CancellationToken cancellationToken,
        params (string Name, object Value)[] parameters)
    {
        await using var command = new NpgsqlCommand(sql, connection, transaction);
        foreach (var (name, value) in parameters)
        {
            command.Parameters.AddWithValue(name, value);
        }

        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
