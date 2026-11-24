import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StaffGate } from './components/StaffGate'
import { Admin } from './screens/Admin'
import { Barber } from './screens/Barber'
import { Display } from './screens/Display'
import { Home } from './screens/Home'
import { Join } from './screens/Join'
import { Reception } from './screens/Reception'
import { Status } from './screens/Status'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<Join />} />
        <Route path="/status/:id" element={<Status />} />
        <Route path="/display" element={<Display />} />
        <Route path="/reception" element={<StaffGate><Reception /></StaffGate>} />
        <Route path="/barber/:name" element={<StaffGate><Barber /></StaffGate>} />
        <Route path="/admin" element={<StaffGate><Admin /></StaffGate>} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
