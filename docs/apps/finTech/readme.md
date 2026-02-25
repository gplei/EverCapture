# Hay Day etc

Any thing related to the game.

## Table of Contents

1. [Manage buildings](#manage-buildings)
2. [Manage products](#manage-products)
3. [Manage product ingredients](#manage-product-ingredients)
4. [Useful SQL](#useful-sql)

## Manage Buildings

- Add a new building
  - update buidingSelect to include the new building
  - Clear products
  - Clear product ingredients
- Update an existing building
  - update buidingSelect to the updated name
- Delete an existing building
  - N/A
- Select a building
  - Update products
  - Clear product ingredients

## Manage Products

- Select a building
- Add a new product
  - Update productSelect to include the new product
  - Clear product ingredients
- Update an existing product
  - update productSelect to the updated name
- Delete an existing product
  - N/A
- Select a product
  - Update product ingredients

## Manage product ingredients

- Select a building
- Select a product
- Add a new product ingredient
  - Update product ingredients to include the new ingredent
- Delete an existing product ingredient
  
## Useful SQL
- Show buildings, products and ingredients
> select b.name, p.name, i.name from ingredients o, products p, products i, buildings b
where o.product_id = p.id and ingredient_id = i.id and b.id=p.building_id
order by b.name, p.name, i.name;
- Givin an ingredient, show what products used it, and how many
> select p.name, pi.count
from products p, products i, ingredients pi
where p.id=pi.product_id and i.id=pi.ingredient_id and i.name='cheese';
- How many ingredient each product has
> select p.name, count(*) from products p
left join ingredients pi on p.id=pi.product_id
left join products i on i.id=pi.ingredient_id
group by p.name;
- All product that has no ingredient
> select p.name from products p
left join ingredients pi on p.id=pi.product_id
left join products i on i.id=pi.ingredient_id
where i.name is null
- Find building from a given product
> select b.name, p.name from buildings b, products p
where p.building_id=b.id
and p.name='Apple';
- Given a level, what building and products are introduced
- Buildings don't have prodcuts
> select b.name, p.name from buildings b
left join products p on p.building_id =b.id
where p.name is null;
