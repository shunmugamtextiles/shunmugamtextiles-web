import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Package, Image as ImageIcon } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'in stock', 'out of stock'

  // Fetch products from Firestore
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'products'));
      let productsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by createdAt (newest first)
      productsList.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });

      // Apply filter if not 'all'
      if (filter !== 'all') {
        productsList = productsList.filter(product => 
          (product.status || 'in stock') === filter
        );
      }

      setProducts(productsList);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-600 text-white py-12 md:py-16 text-center">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">Our Products</h1>
          <p className="text-lg md:text-xl text-blue-100">
            Explore our wide range of premium textile products
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="bg-slate-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Filter Buttons */}
          <div className="mb-8 flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              All Products
            </button>
            <button
              onClick={() => setFilter('in stock')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'in stock'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setFilter('out of stock')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'out of stock'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Out of Stock
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 mt-4">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package size={64} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Products Available</h3>
              <p className="text-slate-500">
                {filter === 'all' 
                  ? 'Check back soon for our latest products!'
                  : `No products found with status: ${filter}`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-md transition-all hover:-translate-y-2 hover:shadow-xl">
                  {/* Product Image */}
                  <div className="w-full h-64 bg-slate-200 flex items-center justify-center p-4">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full ${product.imageUrl ? 'hidden' : 'flex'} items-center justify-center text-slate-400`}
                    >
                      <ImageIcon size={48} />
                    </div>
                  </div>
                  {/* Product Name */}
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-semibold text-blue-900">{product.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Products;
