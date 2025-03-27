'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/hooks/useAuth';
import { ArrowLeft, FileText, Image, File, Trash, Edit, Save, X } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';

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

interface ComprobanteDetailClientProps {
  params: {
    id: string;
  };
}

export default function ComprobanteDetailClient({ params }: ComprobanteDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [comprobante, setComprobante] = useState<Comprobante | null>(null);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const loadData = () => {
      const comprobanteId = params.id as string;
      
      // Load folders
      const storedFolders = localStorage.getItem('folders');
      if (storedFolders) {
        const parsedFolders = JSON.parse(storedFolders);
        const userFolders = parsedFolders.filter((folder: Folder) => folder.userId === user.id);
        setFolders(userFolders);
      }
      
      // Load comprobante
      const storedComprobantes = localStorage.getItem('comprobantes');
      if (storedComprobantes) {
        const parsedComprobantes = JSON.parse(storedComprobantes);
        const foundComprobante = parsedComprobantes.find(
          (comp: Comprobante) => comp.id === comprobanteId && comp.userId === user.id
        );
        
        if (foundComprobante) {
          setComprobante(foundComprobante);
          setDescription(foundComprobante.description || '');
          setSelectedFolder(foundComprobante.folderId);
        } else {
          // Comprobante not found or doesn't belong to user
          router.push('/comprobantes');
        }
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [user, params.id, router]);

  const getFileIcon = () => {
    if (!comprobante) return null;
    
    if (comprobante.fileType.includes('pdf')) {
      return <FileText className="text-red-400" size={64} />;
    } else if (comprobante.fileType.includes('image')) {
      return <Image className="text-blue-400" size={64} />;
    } else {
      return <File className="text-gray-400" size={64} />;
    }
  };

  const handleDeleteComprobante = () => {
    if (!comprobante) return;
    
    if (!confirm('¿Estás seguro de que quieres eliminar este comprobante?')) {
      return;
    }

    try {
      // Remove from localStorage
      const storedComprobantes = localStorage.getItem('comprobantes');
      if (storedComprobantes) {
        const parsedComprobantes = JSON.parse(storedComprobantes);
        const updatedComprobantes = parsedComprobantes.filter(
          (comp: Comprobante) => comp.id !== comprobante.id
        );
        localStorage.setItem('comprobantes', JSON.stringify(updatedComprobantes));
        
        router.push('/comprobantes');
      }
    } catch (error) {
      console.error('Error deleting comprobante:', error);
      setError('Error al eliminar el comprobante');
    }
  };

  const handleSaveChanges = () => {
    if (!comprobante) return;
    
    try {
      // Update in localStorage
      const storedComprobantes = localStorage.getItem('comprobantes');
      if (storedComprobantes) {
        const parsedComprobantes = JSON.parse(storedComprobantes);
        const updatedComprobantes = parsedComprobantes.map((comp: Comprobante) => {
          if (comp.id === comprobante.id) {
            return {
              ...comp,
              description,
              folderId: selectedFolder
            };
          }
          return comp;
        });
        
        localStorage.setItem('comprobantes', JSON.stringify(updatedComprobantes));
        
        // Update state
        setComprobante({
          ...comprobante,
          description,
          folderId: selectedFolder
        });
        setEditing(false);
      }
    } catch (error) {
      console.error('Error updating comprobante:', error);
      setError('Error al actualizar el comprobante');
    }
  };

  const handleViewFile = () => {
    if (!comprobante) return;
    
    if (comprobante.fileData) {
      // For base64 encoded data
      const win = window.open();
      if (win) {
        if (comprobante.fileType.includes('pdf')) {
          win.document.write(`<iframe src="${comprobante.fileData}" width="100%" height="100%"></iframe>`);
        } else {
          win.document.write(`<img src="${comprobante.fileData}" style="max-width: 100%; height: auto;" alt="Preview" />`);
        }
      }
    } else if (comprobante.fileUrl) {
      // For blob URLs or external URLs
      window.open(comprobante.fileUrl, '_blank');
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

  if (!comprobante) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-8">
          <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-center py-8">
              <p className="text-gray-400">Comprobante no encontrado</p>
              <Link
                href="/comprobantes"
                className="inline-flex items-center mt-4 text-blue-400 hover:text-blue-300"
              >
                <ArrowLeft size={16} className="mr-1" />
                Volver a comprobantes
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <Link
              href="/comprobantes"
              className="flex items-center text-gray-400 hover:text-white"
            >
              <ArrowLeft size={20} className="mr-1" />
              <span>Volver a comprobantes</span>
            </Link>
            
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    <X size={16} />
                    <span>Cancelar</span>
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Save size={16} />
                    <span>Guardar</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    <Edit size={16} />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={handleDeleteComprobante}
                    className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <Trash size={16} />
                    <span>Eliminar</span>
                  </button>
                </>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mb-4 bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="bg-gray-700 rounded-lg p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* File Preview */}
              <div className="w-full md:w-1/3 flex flex-col items-center">
                <div 
                  className="w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-750 transition-colors"
                  onClick={handleViewFile}
                >
                  {comprobante.fileType.includes('image') && comprobante.fileData ? (
                    <img 
                      src={comprobante.fileData} 
                      alt={comprobante.filename} 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    getFileIcon()
                  )}
                </div>
                <button
                  onClick={handleViewFile}
                  className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
                >
                  Ver archivo completo
                </button>
              </div>
              
              {/* Comprobante Details */}
              <div className="w-full md:w-2/3 space-y-4">
                <div>
                  <h1 className="text-xl font-bold text-white break-words">
                    {comprobante.filename}
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    Subido el {formatDate(comprobante.createdAt)}
                  </p>
                </div>
                
                <div className="pt-2">
                  <div className="bg-blue-900/20 rounded-md px-3 py-1.5 inline-block">
                    <span className="text-blue-400 text-sm font-medium">
                      {comprobante.fileType.split('/')[1].toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {editing ? (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Carpeta
                      </label>
                      <select
                        value={selectedFolder || ''}
                        onChange={(e) => setSelectedFolder(e.target.value || null)}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sin carpeta</option>
                        {folders.map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Descripción
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="Añade una descripción para este comprobante..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    {comprobante.folderId && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-400">Carpeta</h3>
                        <p className="text-white mt-1">
                          {folders.find(f => f.id === comprobante.folderId)?.name || 'Sin carpeta'}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-400">Descripción</h3>
                      {comprobante.description ? (
                        <p className="text-white mt-1">{comprobante.description}</p>
                      ) : (
                        <p className="text-gray-500 italic mt-1">Sin descripción</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 