import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { Search, X, Moon, Sun, MapPin, FilterX } from 'lucide-react';
import { yerlesimVerileri } from './data';
import { YerlesimYeri } from './types';
import { normalizeTurkish } from './utils/textUtils';
import Pagination from './components/Pagination';

const ITEMS_PER_PAGE = 50;

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState({
    il: '',
    ilce: '',
    belediye: '',
    mahalle: '',
    durum: ''
  });
  
  // Use deferred value for smoother UI during typing if the dataset gets very large
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Initialize Theme
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  // Toggle Theme Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 1. First apply Global Search
  const searchedData = useMemo(() => {
    if (!deferredSearchTerm) return yerlesimVerileri;

    const normalizedQuery = normalizeTurkish(deferredSearchTerm);

    return yerlesimVerileri.filter((item) => {
      return (
        normalizeTurkish(item.il).includes(normalizedQuery) ||
        normalizeTurkish(item.ilce).includes(normalizedQuery) ||
        normalizeTurkish(item.belediye).includes(normalizedQuery) ||
        normalizeTurkish(item.mahalle).includes(normalizedQuery) ||
        normalizeTurkish(item.durum).includes(normalizedQuery)
      );
    });
  }, [deferredSearchTerm]);

  // 2. Then apply Column Filters on top of searched data
  const filteredData = useMemo(() => {
    return searchedData.filter((item) => {
      return (
        (filters.il === '' || item.il === filters.il) &&
        (filters.ilce === '' || item.ilce === filters.ilce) &&
        (filters.belediye === '' || item.belediye === filters.belediye) &&
        (filters.mahalle === '' || normalizeTurkish(item.mahalle).includes(normalizeTurkish(filters.mahalle))) &&
        (filters.durum === '' || item.durum === filters.durum)
      );
    });
  }, [searchedData, filters]);

  // Calculate Options for Dropdowns (Cascading logic)
  // For a specific column, we want to show options available in the dataset filtered by ALL OTHER columns.
  const getOptions = (key: keyof YerlesimYeri) => {
    // Create a filter object excluding the current key
    const otherFilters = { ...filters };
    // @ts-ignore
    delete otherFilters[key];

    // Apply these other filters to the searchedData
    const dataForOptions = searchedData.filter(item => {
      return Object.entries(otherFilters).every(([k, v]) => {
        if (!v) return true;
        if (k === 'mahalle') {
          // Mahalle is usually text search, but if we needed options, we'd use includes
          return normalizeTurkish(item.mahalle).includes(normalizeTurkish(v as string));
        }
        return item[k as keyof YerlesimYeri] === v;
      });
    });

    // Extract unique values
    const uniqueValues = new Set(dataForOptions.map(item => item[key]));
    return Array.from(uniqueValues).sort((a, b) => (a as string).localeCompare(b as string, 'tr'));
  };

  // Memoize options to prevent unnecessary calculations
  const ilOptions = useMemo(() => getOptions('il'), [searchedData, filters.ilce, filters.belediye, filters.mahalle, filters.durum]);
  const ilceOptions = useMemo(() => getOptions('ilce'), [searchedData, filters.il, filters.belediye, filters.mahalle, filters.durum]);
  const belediyeOptions = useMemo(() => getOptions('belediye'), [searchedData, filters.il, filters.ilce, filters.mahalle, filters.durum]);
  const durumOptions = useMemo(() => getOptions('durum'), [searchedData, filters.il, filters.ilce, filters.belediye, filters.mahalle]);

  // Calculate Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  
  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredData]);

  // Reset page when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const handleReset = () => {
    setSearchTerm('');
    setFilters({
      il: '',
      ilce: '',
      belediye: '',
      mahalle: '',
      durum: ''
    });
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen w-full p-4 md:p-8 transition-colors duration-200 flex flex-col">
      
      {/* Header Section */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-lg shadow-lg shrink-0">
            <MapPin className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Kırsal Alan Listesi
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mt-1">
              TÜİK tarafından 31.12.2022 tarihli nüfus verilerine göre kır statüsünde olduğu belirlenen yerleşim yerleri IPARD III Programı için kırsal alan olarak tanımlanmaktadır.
            </p>
          </div>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shrink-0"
          aria-label="Tema Değiştir"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Search Section */}
      <div className="mb-6 w-full max-w-4xl mx-auto">
        <div className="relative flex items-center w-full shadow-sm rounded-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={20} />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            placeholder="İl, İlçe, Mahalle veya Durum ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {(searchTerm || Object.values(filters).some(v => v !== '')) && (
            <button
              onClick={handleReset}
              className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Aramayı ve Filtreleri Temizle"
            >
              <span className="text-xs font-medium hidden sm:block">Temizle</span>
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-grow w-full max-w-7xl mx-auto flex flex-col">
        <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider align-top min-w-[160px]">
                  <div className="flex flex-col gap-2">
                    <span>İl</span>
                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs py-1.5 px-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      value={filters.il}
                      onChange={(e) => handleFilterChange('il', e.target.value)}
                    >
                      <option value="">Tümü</option>
                      {ilOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider align-top min-w-[160px]">
                  <div className="flex flex-col gap-2">
                    <span>İlçe</span>
                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs py-1.5 px-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={filters.ilce}
                      onChange={(e) => handleFilterChange('ilce', e.target.value)}
                    >
                      <option value="">Tümü</option>
                      {ilceOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider align-top min-w-[160px]">
                  <div className="flex flex-col gap-2">
                    <span>Belediye</span>
                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs py-1.5 px-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={filters.belediye}
                      onChange={(e) => handleFilterChange('belediye', e.target.value)}
                    >
                      <option value="">Tümü</option>
                      {belediyeOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider align-top min-w-[200px]">
                  <div className="flex flex-col gap-2">
                    <span>Mahalle</span>
                    <input
                      type="text"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs py-1.5 px-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Mahalle ara..."
                      value={filters.mahalle}
                      onChange={(e) => handleFilterChange('mahalle', e.target.value)}
                    />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider align-top min-w-[140px]">
                  <div className="flex flex-col gap-2">
                    <span>Durum</span>
                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs py-1.5 px-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={filters.durum}
                      onChange={(e) => handleFilterChange('durum', e.target.value)}
                    >
                      <option value="">Tümü</option>
                      {durumOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currentData.length > 0 ? (
                currentData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{item.il}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.ilce}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.belediye}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.mahalle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.durum === 'Kırsal Alan' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {item.durum}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center gap-2">
                    <FilterX size={32} className="text-gray-400 mb-2" />
                    <span>Kriterlere uygun kayıt bulunamadı.</span>
                    <button 
                        onClick={handleReset}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                        Filtreleri Temizle
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-auto pb-8">
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage} 
            />
            <div className="text-center mt-2 text-xs text-gray-400 dark:text-gray-500">
                Sayfa {currentPage} / {totalPages}
            </div>
        </div>
      </div>
    </div>
  );
}


export default App;
