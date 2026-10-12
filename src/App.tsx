import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FaqPage from './pages/FaqPage';
import FeedbackPage from './pages/FeedbackPage';
import HomePage from './pages/HomePage';
import LegalPage from './pages/LegalPage';
import NewsArticlePage from './pages/NewsArticlePage';
import NewsPage from './pages/NewsPage';
import NotFoundPage from './pages/NotFoundPage';
import PolicyPage from './pages/PolicyPage';
import ReportPage from './pages/ReportPage';
import ServicesPage from './pages/ServicesPage';
import SubdomainRegisterPage from './pages/SubdomainRegisterPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path='/' element={<HomePage />} />
        <Route path='/about' element={<AboutPage />} />
        <Route path='/news' element={<NewsPage />} />
        <Route path='/news/:slug' element={<NewsArticlePage />} />
        <Route path='/services' element={<ServicesPage />} />
        <Route path='/services/subdomain' element={<SubdomainRegisterPage />} />
        <Route path='/policy' element={<PolicyPage />} />
        <Route path='/faq' element={<FaqPage />} />
        <Route path='/contact' element={<ContactPage />} />
        <Route path='/report' element={<ReportPage />} />
        <Route path='/feedback' element={<FeedbackPage />} />
        <Route path='/legal' element={<LegalPage />} />
        <Route path='*' element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
