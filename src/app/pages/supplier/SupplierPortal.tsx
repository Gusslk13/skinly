import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button, Input, Select, TextArea } from '../../components/UI';
import { Package, ShieldAlert, Award, FileText, CheckCircle2, ChevronRight, Upload, Leaf } from 'lucide-react';

export const SupplierPortal: React.FC = () => {
  const { 
    currentUser, supplierApplications, submitSupplierApplication, addProduct, products 
  } = useApp();

  const [companyName, setCompanyName] = useState('');
  const [ingredientsDescription, setIngredientsDescription] = useState('');
  const [documentsUrl, setDocumentsUrl] = useState('/documents/lab_results.pdf'); // Simulado

  // Estado para agregar productos
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('Serums');
  const [prodIngredients, setProdIngredients] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');

  const [productAdded, setProductAdded] = useState(false);

  const activeApp = supplierApplications.find(app => app.userId === currentUser?.id);
  const isApproved = activeApp?.status === 'approved';

  const handleApplicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !ingredientsDescription) {
      alert('Por favor completa todos los campos de la solicitud.');
      return;
    }
    submitSupplierApplication(companyName, ingredientsDescription, documentsUrl);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodIngredients) {
      alert('Por favor completa los campos requeridos del producto.');
      return;
    }

    const cleanIngredients = prodIngredients
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    const fallbackImages = [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=600'
    ];

    const randomImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];

    addProduct({
      name: prodName,
      description: prodDesc || `${prodName} es una formulación eco-lux fabricada en laboratorios asociados.`,
      ingredients: cleanIngredients,
      category: prodCategory,
      price: Number(prodPrice),
      stock: 30,
      imageUrl: prodImageUrl.trim() || randomImage,
      isVerified: false, // ¡Debe ser auditado por admin primero!
      isFeatured: false,
      supplierId: currentUser?.id
    });

    setProdName('');
    setProdDesc('');
    setProdPrice('');
    setProdIngredients('');
    setProdImageUrl('');

    setProductAdded(true);
    setTimeout(() => setProductAdded(false), 4000);
  };

  const supplierProducts = products.filter(p => p.supplierId === currentUser?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-8 text-left">
      
      {/* Título */}
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold text-brand-black">Portal de Proveedor de Laboratorio</h1>
        <p className="text-xs text-brand-black/40 font-medium">Registra certificados de extracción de laboratorio y sube botánicos activos crudos.</p>
      </div>

      {!activeApp ? (
        /* FORMULARIO DE SOLICITUD (AÚN NO APLICADO) */
        <div className="max-w-2xl bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 shadow-sm space-y-6">
          <div className="space-y-1.5 border-b border-brand-black/5 pb-3">
            <h2 className="font-heading text-xl font-bold text-brand-black flex items-center gap-2">
              <Award className="text-brand-green-dark" size={20} />
              Solicitud de Verificación de Proveedor
            </h2>
            <p className="text-[11px] text-brand-black/50 leading-relaxed font-semibold">
              Antes de vender en Skinly, tu laboratorio, técnicas de extracción y certificados químicos deben pasar por una auditoría física de nuestro equipo administrativo.
            </p>
          </div>

          <form onSubmit={handleApplicationSubmit} className="space-y-4">
            <Input
              label="Nombre del Laboratorio / Empresa"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="OrgaSkyn Botanical Labs, S.A. de C.V."
              required
            />

            <TextArea
              label="Descripción de Origen y Extracción de Compuestos Orgánicos"
              value={ingredientsDescription}
              onChange={(e) => setIngredientsDescription(e.target.value)}
              placeholder="Describe tu proceso de extracción, complejos activos, pruebas de parabenos y certificaciones ecológicas..."
              required
            />

            {/* Adjunto de documentos */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-black/60">
                Documentos de Certificación FDA y Orgánica
              </label>
              <div className="border border-dashed border-brand-black/20 rounded-luxury p-6 bg-brand-gray-soft text-center flex flex-col items-center justify-center cursor-pointer hover:bg-brand-black/5 transition-colors">
                <Upload className="text-brand-black/40 mb-2" size={24} />
                <span className="block text-xs font-bold text-brand-black">Adjuntando: lab_certificate_v4.pdf</span>
                <span className="block text-[10px] text-brand-black/40 mt-1">Carga simulada (Sello orgánico registrado FDA)</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              className="py-3"
            >
              Enviar Solicitud de Verificación
            </Button>
          </form>
        </div>
      ) : (
        /* PANTALLA DE ESTADO DE SOLICITUD ACTIVA */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Tarjeta de monitoreo de estado */}
          <div className="space-y-6">
            <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black pb-2 border-b border-brand-black/5">
                Estado de Solicitud
              </h3>

              {activeApp.status === 'pending' && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-luxury space-y-2 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="font-extrabold uppercase">Auditoría de Verificación Pendiente</span>
                  </div>
                  <p className="opacity-80 leading-relaxed">
                    Nuestros ingenieros están auditando tus documentos de extracción. Revisaremos tus fórmulas una vez aprobado.
                  </p>
                </div>
              )}

              {activeApp.status === 'rejected' && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-luxury space-y-2 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} />
                    <span className="font-extrabold uppercase">Solicitud Rechazada</span>
                  </div>
                  <p className="opacity-80 leading-relaxed">
                    Motivo: **{activeApp.verificationNotes || 'Sellos de verificación de certificado incorrectos.'}**
                  </p>
                </div>
              )}

              {activeApp.status === 'approved' && (
                <div className="p-4 bg-brand-green-dark/10 border border-brand-green-dark/15 text-brand-green-dark rounded-luxury space-y-2 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span className="font-extrabold uppercase">Laboratorio Certificado Skinly</span>
                  </div>
                  <p className="opacity-80 leading-relaxed">
                    ¡Verificado! Estás certificado para subir productos orgánicos de alto rendimiento directamente al catálogo.
                  </p>
                </div>
              )}

              <div className="space-y-3.5 text-xs text-brand-black/70 bg-brand-gray-soft p-4 rounded-luxury border border-brand-black/5">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-brand-black/40">Laboratorio:</span>
                  <span className="font-bold text-brand-black block">{activeApp.companyName}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-brand-black/40">Registrado el:</span>
                  <span>{activeApp.createdAt}</span>
                </div>
              </div>
            </div>

            {/* Directorio de productos del proveedor aprobado */}
            {isApproved && (
              <div className="bg-brand-white p-6 rounded-luxury border border-brand-black/5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black pb-2 border-b border-brand-black/5">
                  Tus Formulaciones Subidas
                </h3>
                {supplierProducts.length > 0 ? (
                  <div className="space-y-3">
                    {supplierProducts.map((p, idx) => (
                      <div key={idx} className="flex gap-3 items-center border-b border-brand-black/5 pb-2.5 last:border-0 last:pb-0">
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-12 object-cover rounded-md border border-brand-black/5 bg-brand-gray-soft shrink-0" />
                        <div className="truncate text-xs">
                          <span className="font-bold text-brand-black block truncate">{p.name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${p.isVerified ? 'bg-brand-green-dark' : 'bg-amber-500'}`} />
                            <span className="text-[10px] text-brand-black/40 font-semibold uppercase tracking-wider">
                              {p.isVerified ? 'Activo Verificado' : 'En Espera de Auditoría'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-brand-black/40 text-center py-4">No hay formulaciones personalizadas subidas aún.</p>
                )}
              </div>
            )}
          </div>

          {/* Columnas derechas (2/3) - Asistente de carga de formulaciones (si está aprobado) */}
          <div className="lg:col-span-2">
            {isApproved ? (
              <div className="bg-brand-white p-6 sm:p-8 rounded-luxury border border-brand-black/5 shadow-sm space-y-6">
                <div className="space-y-1.5 border-b border-brand-black/5 pb-3">
                  <h2 className="font-heading text-xl font-bold text-brand-black flex items-center gap-2">
                    <Leaf className="text-brand-green-dark" size={18} />
                    Registrar Formulación de Laboratorio Personalizada
                  </h2>
                  <p className="text-[11px] text-brand-black/50 leading-relaxed font-semibold">
                    Sube tus compuestos activos, descripción clínica y parámetros del catálogo mayorista. Los artículos enviados esperarán verificación del Admin antes de aparecer en las búsquedas de clientes.
                  </p>
                </div>

                {productAdded && (
                  <div className="p-3 bg-brand-green-dark/15 border border-brand-green-dark/20 text-brand-green-dark rounded-luxury text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>¡Producto registrado exitosamente! Enviado para verificación de ingredientes por Administración.</span>
                  </div>
                )}

                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nombre del Producto"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="Alternativa Botánica al Retinol"
                      required
                    />
                    <Input
                      label="Precio de Catálogo ($)"
                      type="number"
                      min="1"
                      step="0.5"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      placeholder="45.00"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Categoría de Skincare"
                      options={[
                        { value: 'Serums', label: 'Serums' },
                        { value: 'Moisturizers', label: 'Hidratantes' },
                        { value: 'Cleansers', label: 'Limpiadores' },
                        { value: 'Toners', label: 'Tónicos' },
                        { value: 'Anti-Aging', label: 'Antienvejecimiento' }
                      ]}
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                    />
                    <Input
                      label="URL de Imagen Personalizada (Opcional)"
                      value={prodImageUrl}
                      onChange={(e) => setProdImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>

                  <TextArea
                    label="Desglose de Ingredientes Activos (Separados por coma)"
                    value={prodIngredients}
                    onChange={(e) => setProdIngredients(e.target.value)}
                    placeholder="Ácido Hialurónico, Ceramidas Vegetales, Extracto de Almendra Dulce, Escualano..."
                    required
                  />

                  <TextArea
                    label="Beneficios Clínicos y Descripción de la Formulación"
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    placeholder="Proporciona descripción de mecanismos bioactivos, beneficios de absorción dérmica..."
                  />

                  <div className="pt-4 border-t border-brand-black/5 flex justify-end">
                    <Button
                      type="submit"
                      variant="secondary"
                      className="px-6 py-2.5 text-xs gap-1.5"
                    >
                      <span>Enviar para Auditoría de Lab</span>
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-brand-white p-8 rounded-luxury border border-brand-black/5 shadow-sm text-center py-20 flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
                <FileText size={44} className="text-brand-black/20 stroke-1" />
                <h3 className="font-heading text-lg font-bold text-brand-black">Accediendo al Asistente de Carga...</h3>
                <p className="text-xs text-brand-black/50 leading-relaxed font-semibold max-w-sm">
                  Debes ser aprobado por el administrador de la plataforma antes de enviar nuevas formulaciones al catálogo. Revisa tu panel de estado.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
