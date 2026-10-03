import { CATEGORIES } from "../constants/categories";

export default function SearchBar({
  search,
  category,
  sort,
  onSearchChange,
  onCategoryChange,
  onSortChange,
}) {
  return (
    <form className="catalog-filters" onSubmit={(event) => event.preventDefault()}>
      <label className="field" htmlFor="product-search">
        Search
        <input
          id="product-search"
          type="search"
          value={search}
          placeholder="Search products..."
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      <label className="field" htmlFor="product-category">
        Category
        <select
          id="product-category"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="field" htmlFor="product-sort">
        Sort
        <select id="product-sort" value={sort} onChange={(event) => onSortChange(event.target.value)}>
          <option value="">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </label>
    </form>
  );
}
