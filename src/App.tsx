import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Products from './pages/Products';
import Profile from './pages/Profile';
import CartPage from './pages/Cart';
import { useAtom } from 'jotai';
import { authAtom } from './store/auth';
import ProductDetail from './pages/ProductDetail';
import { useEffect } from 'react';
import { api } from './api';
import './styles/theme.css'
import { userAtom } from './store/user';
import 'react-toastify/dist/ReactToastify.css';
import { cartAtom } from './store/cart';

function App() {

  const [auth, setAuth] = useAtom(authAtom);
  const [_, setUser] = useAtom(userAtom);
  const [__, setCart] = useAtom(cartAtom);
  useEffect(() => {
    api.get('/auth/me').then((res) => {
      setUser(res.data);
      setCart(res.data.cart[0] || {
        id_cart: null,
        id_user: res.data.id_user,
        items: []
      });
    }).catch(() => {
      setAuth({
        access_token: null,
        isAuthenticated: false,
        id_enterprise: null
      })
    })
  }, [auth.isAuthenticated]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:name_store" element={<Layout />}>
          <Route path="/:name_store" element={<Products />} />
        </Route>
        <Route path="/:name_store/product/:id_product" element={<ProductDetail />} />
        <Route path="/:name_store/profile" element={<Profile />} />
        <Route path="/:name_store/cart" element={<CartPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;