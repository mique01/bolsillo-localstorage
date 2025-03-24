'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/hooks/useAuth';
import { Upload, Loader2, X, FileText, Image, File, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';

interface Folder {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export default function NuevoComprobantePage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Load folders from localStorage
    const storedFolders = localStorage.getItem('folders');
    if (storedFolders) {
      const parsedFolders = JSON.parse(storedFolders);
      const userFolders = parsedFolders.filter((folder: Folder) => folder.userId === user.id);
      setFolders(userFolders);
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    const selectedFile = selectedFiles[0];
    setFile(selectedFile);

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Tipo de archivo no válido. Solo se permiten PDF, JPEG, JPG y PNG.');
      return;
    }

    // Create preview for images only
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      // For PDFs or other files, just show icon
      setFilePreview(null);
    }
    
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(droppedFile.type)) {
        setError('Tipo de archivo no válido. Solo se permiten PDF, JPEG, JPG y PNG.');
        return;
      }
      
      setFile(droppedFile);
      
      // Preview for images
      if (droppedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(droppedFile);
      } else {
        setFilePreview(null);
      }
      
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    
    if (file.type === 'application/pdf') {
      return <FileText className="text-red-400" size={48} />;
    } else if (file.type.startsWith('image/')) {
      return <Image className="text-blue-400" size={48} />;
    } else {
      return <File className="text-gray-400" size={48} />;
    }
  };

  // Función para comprimir una imagen
  const compressImage = async (file: File, quality: number = 0.6, maxWidth: number = 1200): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Si no es una imagen, simplemente leer como base64
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      // Para imágenes, comprimir usando canvas
      const reader = new FileReader();
      reader.onload = (event) => {
        // Crear elemento de imagen para cargar el archivo
        const img = document.createElement('img');
        img.onload = () => {
          // Calcular dimensiones proporcionales para reducir tamaño
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }

          // Crear canvas y dibujar la imagen con las nuevas dimensiones
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir a base64 con la calidad especificada
          // Para JPEG y PNG usamos el formato original
          // Para otros formatos usamos JPEG como fallback
          const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(format, quality);
          
          resolve(dataUrl);
        };
        
        img.onerror = () => {
          reject(new Error('Error al cargar la imagen para compresión'));
        };
        
        img.src = event.target?.result as string;
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Debes iniciar sesión para subir comprobantes');
      return;
    }

    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Read file data as base64 with compression for images
      let fileData;
      
      try {
        // Intentar comprimir con calidad media primero
        fileData = await compressImage(file, 0.6);
      } catch (compressionError) {
        console.error('Error compressing image:', compressionError);
        // Fallar con gracia, intentar leer el archivo original
        fileData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const newComprobante = {
        id: Date.now().toString(),
        userId: user.id,
        filename: file.name,
        fileType: file.type,
        fileData: fileData,
        folderId: selectedFolder,
        description: description || null,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      // Get existing comprobantes from localStorage
      const existingComprobantes = JSON.parse(localStorage.getItem('comprobantes') || '[]');
      
      try {
        // Intentar guardar en localStorage
        localStorage.setItem('comprobantes', JSON.stringify([...existingComprobantes, newComprobante]));
        router.push('/comprobantes');
      } catch (storageError) {
        // Si ocurre un error QuotaExceededError, intentar comprimir más o limpiar
        if (storageError instanceof DOMException && 
            (storageError.name === 'QuotaExceededError' || storageError.code === 22)) {
          
          setError('El archivo es demasiado grande. Intentando comprimir más...');
          
          // Si es una imagen, intentar con mayor compresión
          if (file.type.startsWith('image/')) {
            try {
              // Comprimir con calidad baja y dimensiones menores
              const compressedData = await compressImage(file, 0.3, 800);
              
              // Actualizar el comprobante con datos comprimidos
              newComprobante.fileData = compressedData;
              
              // Intentar guardar de nuevo
              localStorage.setItem('comprobantes', JSON.stringify([...existingComprobantes, newComprobante]));
              setError(null);
              router.push('/comprobantes');
              return;
            } catch (compressError) {
              console.error('Error with higher compression:', compressError);
            }
          }
          
          // Si la compresión adicional no funciona o no es una imagen, 
          // eliminar comprobantes antiguos
          setError('El almacenamiento está lleno. Eliminando algunos archivos antiguos para hacer espacio...');
          
          // Ordenar comprobantes por fecha (los más antiguos primero)
          const sortedComprobantes = [...existingComprobantes].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          // Eliminar el 30% más antiguo de comprobantes o al menos 3 comprobantes
          const numToRemove = Math.max(3, Math.floor(sortedComprobantes.length * 0.3));
          const trimmedComprobantes = sortedComprobantes.slice(numToRemove);
          
          // Guardar lista actualizada sin los comprobantes eliminados
          localStorage.setItem('comprobantes', JSON.stringify(trimmedComprobantes));
          
          // Intentar guardar de nuevo con la lista reducida
          try {
            localStorage.setItem('comprobantes', JSON.stringify([...trimmedComprobantes, newComprobante]));
            setError(null);
            alert('Se han eliminado algunos comprobantes antiguos para hacer espacio.');
            router.push('/comprobantes');
          } catch (finalError) {
            // Si sigue fallando, sugerir un archivo más pequeño
            setError('No se pudo guardar. El archivo es demasiado grande. Intenta con un archivo más pequeño o elimina comprobantes antiguos manualmente.');
          }
        } else {
          throw storageError; // Re-lanzar si es un error diferente
        }
      }
    } catch (error) {
      console.error('Error creating comprobante:', error);
      setError('Ha ocurrido un error al guardar el comprobante. Intenta con un archivo más pequeño.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Subir Comprobante</h2>
            <Link
              href="/comprobantes"
              className="flex items-center text-gray-400 hover:text-white"
            >
              <ArrowLeft size={20} className="mr-1" />
              <span>Volver</span>
            </Link>
          </div>
          
          {error && (
            <div className="mb-4 bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-lg">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Archivo de Comprobante
              </label>
              
              {!file ? (
                <div 
                  className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-400">
                    Arrastra un archivo aquí o{' '}
                    <span className="text-blue-400">selecciona un archivo</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, JPG, JPEG o PNG
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
              ) : (
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {filePreview ? (
                        <div className="h-14 w-14 flex-shrink-0 rounded overflow-hidden border border-gray-600">
                          <img src={filePreview} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        getFileIcon()
                      )}
                      <div>
                        <p className="text-white font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1].toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Folder Selection */}
            <div>
              <label htmlFor="folder" className="block text-sm font-medium text-gray-300 mb-1">
                Carpeta (Opcional)
              </label>
              <select
                id="folder"
                value={selectedFolder || ''}
                onChange={(e) => setSelectedFolder(e.target.value || null)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin carpeta</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                Descripción (Opcional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Añade una descripción para este comprobante..."
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !file}
              className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                (isLoading || !file) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Subiendo...
                </>
              ) : (
                'Guardar Comprobante'
              )}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
} 