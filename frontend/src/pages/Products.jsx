import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import { CATEGORIES } from "../constants/categories";
import useCustomer from "../hooks/useCustomer";
import { fetchProducts } from "../services/products";

const sorts = new Set(["price_asc", "price_desc"]);

export default function Products() {
  const customer = useCustomer();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "";
  const sortParam = searchParams.get("sort") || "";
  const category = CATEGORIES.includes(categoryParam) ? categoryParam : "";
  const sort = sorts.has(sortParam) ? sortParam : "";
  const searchQuery = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [trackedQuery, setTrackedQuery] = useState(searchQuery);
  const [catalog, setCatalog] = useState({ key: "", products: [], status: "loading" });

  if (searchQuery !== trackedQuery) {
    setTrackedQuery(searchQuery);
    setSearchInput(searchQuery);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch = searchInput.trim();

      if (nextSearch === searchQuery) {
        return;
      }

      const params = {};

      if (nextSearch) {
        params.search = nextSearch;
      }

      if (category) {
        params.category = category;
      }

      if (sort) {
        params.sort = sort;
      }

      setSearchParams(params, { replace: true });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, category, sort, setSearchParams]);

  useEffect(() => {
    if (!customer) {
      return undefined;
    }

    const requestKey = JSON.stringify({ search: searchQuery, category, sort });
    let active = true;

    fetchProducts({ search: searchQuery, category, sort })
      .then((data) => {
        if (!active) {
          return;
        }

        const nextProducts = data.products || [];
        setCatalog({
          key: requestKey,
          products: nextProducts,
          status: nextProducts.length === 0 ? "empty" : "ready",
        });
      })
      .catch(() => {
        if (active) {
          setCatalog({ key: requestKey, products: [], status: "error" });
        }
      });

    return () => {
      active = false;
    };
  }, [customer, searchQuery, category, sort]);

  function updateFilters({ nextCategory = category, nextSort = sort }) {
    const params = {};
    const nextSearch = searchInput.trim();

    if (nextSearch) {
      params.search = nextSearch;
    }

    if (nextCategory) {
      params.category = nextCategory;
    }

    if (nextSort) {
      params.sort = nextSort;
    }

    setSearchParams(params);
  }

  const requestKey = JSON.stringify({ search: searchQuery, category, sort });
  const products = catalog.key === requestKey ? catalog.products : [];
  const status = catalog.key === requestKey ? catalog.status : "loading";

  if (!customer) {
    return (
      <main className="catalog">
        <p>Checking your account...</p>
      </main>
    );
  }

  return (
    <main className="catalog">
      <h1>Products</h1>
      <p className="lede">Search the shelf, then open a product for the full description.</p>
      <SearchBar
        search={searchInput}
        category={category}
        sort={sort}
        onSearchChange={setSearchInput}
        onCategoryChange={(value) => updateFilters({ nextCategory: value })}
        onSortChange={(value) => updateFilters({ nextSort: value })}
      />
      {status === "loading" && <p className="catalog-status">Loading products...</p>}
      {status === "error" && (
        <p className="catalog-status form-error" role="alert">
          Something went wrong while loading products.
        </p>
      )}
      {status === "empty" && <p className="catalog-status">No products found.</p>}
      {status === "ready" && (
        <ul className="product-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </ul>
      )}
    </main>
  );
}
