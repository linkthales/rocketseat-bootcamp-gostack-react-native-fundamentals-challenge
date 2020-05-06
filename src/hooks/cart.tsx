import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStored = await AsyncStorage.getItem(
        '@GoMarketPlace:products',
      );

      if (productsStored) {
        setProducts(JSON.parse(productsStored));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async productToAdd => {
      const productIndex = products.findIndex(
        product => product.id === productToAdd.id,
      );

      if (productIndex === -1) {
        const newProduct = { ...productToAdd, quantity: 1 };

        setProducts([...products, newProduct]);

        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify([...products, newProduct]),
        );

        return;
      }

      products[productIndex].quantity += 1;

      setProducts([...products]);

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify([...products]),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = [...products];
      const productIndex = products.findIndex(product => product.id === id);

      if (productIndex > -1) {
        newProducts[productIndex].quantity += 1;
        setProducts(newProducts);
      }

      await AsyncStorage.setItem('GoMarket:Cart', JSON.stringify(newProducts));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      if (productIndex === -1) {
        setProducts([...products]);

        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify([...products]),
        );

        return;
      }

      products[productIndex].quantity -= 1;

      if (products[productIndex].quantity < 1) {
        products.splice(productIndex, 1);
      }

      setProducts([...products]);

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify([...products]),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
