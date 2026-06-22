import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import SalaView from './modules/sala/SalaView'
import ProductosView from './modules/productos/ProductosView'
import CajaView from './modules/caja/CajaView'
import InformesView from './modules/informes/InformesView'
import ReservasView from './modules/reservas/ReservasView'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/sala" replace />} />
        <Route path="/sala" element={<SalaView />} />
        <Route path="/productos" element={<ProductosView />} />
        <Route path="/caja" element={<CajaView />} />
        <Route path="/informes" element={<InformesView />} />
        <Route path="/reservas" element={<ReservasView />} />
      </Route>
    </Routes>
  )
}
