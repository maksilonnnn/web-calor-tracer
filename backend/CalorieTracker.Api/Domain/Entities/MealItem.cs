using CalorieTracker.Api.Domain.ValueObjects;

namespace CalorieTracker.Api.Domain.Entities;

/// <summary>
/// Позиция приёма пищи: продукт (снимок) и его количество в граммах.
/// </summary>
public sealed class MealItem
{
    public Guid Id { get; }

    public Product Product { get; private set; }

    public GramAmount Quantity { get; private set; }

    private MealItem(Guid id, Product product, GramAmount quantity)
    {
        Id = id;
        Product = product;
        Quantity = quantity;
    }

    public static MealItem Create(Product product, GramAmount quantity, Guid? id = null) =>
        new(id ?? Guid.NewGuid(), product, quantity);

    /// <summary>Изменение количества позиции (значение уже провалидировано).</summary>
    public void ChangeQuantity(GramAmount quantity) => Quantity = quantity;
}
