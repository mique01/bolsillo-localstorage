'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Upload, Trash, Plus, Folder, FolderPlus, Edit, File, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';

interface Comprobante {
  id: string;
  userId: string;
  filename: string;
  fileType: string;
  fileUrl?: string;
  fileData?: string;
  folderId: string | null;
  description?: string;
  date: string;
  createdAt: string;
}

interface Folder {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export default function ComprobantesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredComprobantes, setFilteredComprobantes] = useState<Comprobante[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  useEffect(() => {
    if (!user) return;

    // Load comprobantes and folders from localStorage
    loadData();
  }, [user]);

  const loadData = () => {
    // Load folders
    const storedFolders = localStorage.getItem('folders');
    if (storedFolders) {
      const parsedFolders = JSON.parse(storedFolders);
      const userFolders = parsedFolders.filter((folder: Folder) => folder.userId === user?.id);
      setFolders(userFolders);
    }

    // Load comprobantes
    const storedComprobantes = localStorage.getItem('comprobantes');
    if (storedComprobantes) {
      const parsedComprobantes = JSON.parse(storedComprobantes);
      const userComprobantes = parsedComprobantes.filter((comp: Comprobante) => comp.userId === user?.id);
      setComprobantes(userComprobantes);
      setFilteredComprobantes(userComprobantes);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Apply filters and folder selection
    if (!comprobantes.length) {
      setFilteredComprobantes([]);
      return;
    }
    
    let filtered = comprobantes;
    
    // Filter by current folder
    if (currentFolder) {
      filtered = filtered.filter(comp => comp.folderId === currentFolder);
    } else {
      // In root, show only unclassified comprobantes
      filtered = filtered.filter(comp => comp.folderId === null);
    }
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(comp => 
        comp.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (comp.description && comp.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredComprobantes(filtered);
  }, [searchTerm, comprobantes, currentFolder]);

  const handleDeleteComprobante = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('¿Estás seguro de que quieres eliminar este comprobante?')) {
      return;
    }

    try {
      // Remove from localStorage
      const storedComprobantes = localStorage.getItem('comprobantes');
      if (storedComprobantes) {
        const parsedComprobantes = JSON.parse(storedComprobantes);
        const updatedComprobantes = parsedComprobantes.filter((comp: Comprobante) => comp.id !== id);
        localStorage.setItem('comprobantes', JSON.stringify(updatedComprobantes));
        
        // Update state
        const userComprobantes = updatedComprobantes.filter((comp: Comprobante) => comp.userId === user?.id);
        setComprobantes(userComprobantes);
      }
    } catch (error) {
      console.error('Error deleting comprobante:', error);
      alert('Error al eliminar el comprobante');
    }
  };
  
  const handleAddFolder = () => {
    if (!newFolderName.trim()) {
      alert('Por favor, ingresa un nombre para la carpeta');
      return;
    }

    try {
      const newFolder: Folder = {
        id: Date.now().toString(),
        userId: user?.id || '',
        name: newFolderName.trim(),
        createdAt: new Date().toISOString()
      };

      // Save to localStorage
      const existingFolders = JSON.parse(localStorage.getItem('folders') || '[]');
      localStorage.setItem('folders', JSON.stringify([...existingFolders, newFolder]));

      // Update state
      setFolders([...folders, newFolder]);
      setShowAddFolder(false);
      setNewFolderName('');
    } catch (error) {
      console.error('Error adding folder:', error);
      alert('Error al crear la carpeta');
    }
  };
  
  const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('¿Estás seguro de que quieres eliminar esta carpeta? Los comprobantes dentro serán movidos a la raíz.')) {
      return;
    }

    try {
      // First move all files in this folder to root
      const storedComprobantes = localStorage.getItem('comprobantes');
      if (storedComprobantes) {
        const parsedComprobantes = JSON.parse(storedComprobantes);
        const updatedComprobantes = parsedComprobantes.map((comp: Comprobante) => {
          if (comp.folderId === id) {
            return { ...comp, folderId: null };
          }
          return comp;
        });
        localStorage.setItem('comprobantes', JSON.stringify(updatedComprobantes));
        
        // Update comprobantes state
        const userComprobantes = updatedComprobantes.filter((comp: Comprobante) => comp.userId === user?.id);
        setComprobantes(userComprobantes);
      }
      
      // Remove folder
      const storedFolders = localStorage.getItem('folders');
      if (storedFolders) {
        const parsedFolders = JSON.parse(storedFolders);
        const updatedFolders = parsedFolders.filter((folder: Folder) => folder.id !== id);
        localStorage.setItem('folders', JSON.stringify(updatedFolders));
        
        // Update folders state
        const userFolders = updatedFolders.filter((folder: Folder) => folder.userId === user?.id);
        setFolders(userFolders);
        
        // If we're in the folder being deleted, go back to root
        if (currentFolder === id) {
          setCurrentFolder(null);
        }
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Error al eliminar la carpeta');
    }
  };
  
  const handleEditFolder = (folder: Folder, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingFolder(folder);
    setNewFolderName(folder.name);
  };
  
  const handleUpdateFolder = () => {
    if (!editingFolder || !newFolderName.trim()) return;
    
    try {
      const updatedFolder = { ...editingFolder, name: newFolderName.trim() };
      
      // Save to localStorage
      const storedFolders = localStorage.getItem('folders');
      if (storedFolders) {
        const parsedFolders = JSON.parse(storedFolders);
        const updatedFolders = parsedFolders.map((folder: Folder) => 
          folder.id === updatedFolder.id ? updatedFolder : folder
        );
        localStorage.setItem('folders', JSON.stringify(updatedFolders));
        
        // Update state
        const userFolders = updatedFolders.filter((folder: Folder) => folder.userId === user?.id);
        setFolders(userFolders);
      }
      
      setEditingFolder(null);
      setNewFolderName('');
    } catch (error) {
      console.error('Error updating folder:', error);
      alert('Error al actualizar la carpeta');
    }
  };
  
  const handleOpenFolder = (folderId: string) => {
    setCurrentFolder(folderId);
    setSearchTerm('');
  };
  
  const handleViewComprobante = (comprobante: Comprobante) => {
    // En vez de abrir la ventana aquí, redirigir a la página de detalle
    router.push(`/comprobantes/${comprobante.id}`);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="text-red-400" size={24} />;
    } else if (fileType.includes('image')) {
      return <FileText className="text-blue-400" size={24} />;
    } else {
      return <File className="text-gray-400" size={24} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Comprobantes</h1>
              {currentFolder && (
                <div className="flex items-center text-gray-400">
                  <ChevronRight size={20} />
                  <span>
                    {folders.find(f => f.id === currentFolder)?.name}
                  </span>
                  <button 
                    onClick={() => setCurrentFolder(null)}
                    className="ml-2 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    (Volver)
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddFolder(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <FolderPlus size={20} />
                <span>Nueva Carpeta</span>
              </button>
              <Link
                href="/comprobantes/nuevo"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload size={20} />
                <span>Subir Comprobante</span>
              </Link>
            </div>
          </div>

          {/* Modal para añadir o editar carpeta */}
          {(showAddFolder || editingFolder) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold text-white mb-4">
                  {editingFolder ? 'Editar Carpeta' : 'Nueva Carpeta'}
                </h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nombre de la carpeta
                  </label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowAddFolder(false);
                      setEditingFolder(null);
                      setNewFolderName('');
                    }}
                    className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingFolder ? handleUpdateFolder : handleAddFolder}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingFolder ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar comprobantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Lista de carpetas (solo se muestra en la raíz) */}
            {!currentFolder && folders.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-white mb-4">Carpetas</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {folders.map(folder => (
                    <div
                      key={folder.id}
                      onClick={() => handleOpenFolder(folder.id)}
                      className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Folder className="text-yellow-400" size={24} />
                          <span className="text-white font-medium truncate">{folder.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={(e) => handleEditFolder(folder, e)}
                            className="p-1 text-gray-400 hover:text-blue-400"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteFolder(folder.id, e)}
                            className="p-1 text-gray-400 hover:text-red-400"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de comprobantes */}
            <div>
              <h2 className="text-lg font-medium text-white mb-4">
                {currentFolder 
                  ? `Comprobantes en ${folders.find(f => f.id === currentFolder)?.name}` 
                  : 'Comprobantes sin carpeta'}
              </h2>

              {filteredComprobantes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-300">No hay comprobantes</h3>
                  <p className="mt-2 text-gray-400">
                    {currentFolder 
                      ? 'Esta carpeta está vacía. Sube un comprobante y asígnalo a esta carpeta.' 
                      : 'Comienza subiendo tu primer comprobante.'}
                  </p>
                  <Link
                    href="/comprobantes/nuevo"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Upload size={20} />
                    <span>Subir Comprobante</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredComprobantes.map((comprobante) => (
                    <div
                      key={comprobante.id}
                      onClick={() => handleViewComprobante(comprobante)}
                      className="bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 flex items-start gap-2">
                            {getFileIcon(comprobante.fileType)}
                            <div>
                              <h3 className="text-lg font-medium text-white truncate" title={comprobante.filename}>
                                {comprobante.filename}
                              </h3>
                              {comprobante.description && (
                                <p className="text-sm text-gray-400 mt-1">{comprobante.description}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteComprobante(comprobante.id, e)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                            title="Eliminar"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm">
                          <span className="text-gray-400">
                            {formatDate(comprobante.createdAt)}
                          </span>
                          <span className="text-blue-400 text-xs bg-blue-900/30 px-2 py-0.5 rounded">
                            {comprobante.fileType.split('/')[1].toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 