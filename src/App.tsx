import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import TaskDetails from './pages/TaskDetails';
import FAQ from './pages/FAQ';
import Profile from './pages/Profile';
import CheckIn from './pages/CheckIn';
import Management from './pages/Management';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="tasks/:id" element={<TaskDetails />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="profile" element={<Profile />} />
            <Route path="management" element={<Management />} />
          </Route>
          {/* Full screen routes without bottom nav */}
          <Route path="/check-in" element={
            <div className="h-screen bg-background p-4 pt-safe pb-safe overflow-y-auto">
              <CheckIn />
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
