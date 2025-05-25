import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Products from './pages/Products';
import Profile from './pages/Profile';
import { useAtom } from 'jotai';
import { authAtom } from './store/auth';
import { Navigate } from 'react-router-dom';
import ProductDetail from './pages/ProductDetail';
import { useEffect } from 'react';
import { api } from './api';
import './styles/theme.css'
import { userAtom } from './store/user';


function App() {

  const [auth, setAuth] = useAtom(authAtom);
  const [_, setUser] = useAtom(userAtom);

  useEffect(() => {
    api.get('/auth/me').then((res) => {
      setUser(res.data);
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
        <Route path="/enterprise/:id_enterprise" element={<Layout />}>
          <Route path="/enterprise/:id_enterprise" element={<Products />} />
        </Route>
        <Route path="/enterprise/:id_enterprise/product/:id_product" element={<ProductDetail />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;