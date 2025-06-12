import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, X, MessageCircle, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { Product, Prices, Category } from '../types';
import { api } from '../api';
import { useAtom } from 'jotai';
import { addToCartAtom, cartAtom } from '../store/cart';
import { authAtom } from '../store/auth';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import AuthModal from '../components/AuthModal';
import { userAtom } from '../store/user';
import { Enterprise } from '../types/enterprise';
import { toast } from 'react-toastify';

const ProductDetail = () => {
  const { id_product, name_store } = useParams();

  const [product, setProduct] = useState<Product | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrice, setSelectedPrice] = useState<Prices | null>(null);
  const [includeService, setIncludeService] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [quoteNote, setQuoteNote] = useState('');
  const [, addToCart] = useAtom(addToCartAtom);
  const [auth] = useAtom(authAtom);
  const [user] = useAtom(userAtom);
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [cart] = useAtom(cartAtom);

  useEffect(() => {

    const fetchEnterprise = async () => {
      const { data } = await api.get(`/enterprise/${name_store}`);

      document.title = ` loja | ${data.name}`;

      setEnterprise(data);
    }

    fetchEnterprise();

    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get(`/product/${id_product}`);
        setProduct(data);
        if (data.price && data.price.length > 0) {
          setSelectedPrice(data.price[0]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
  }, [id_product]);

  useEffect(() => {
    const fetchCategory = async () => {
      const { data } = await api.get(`/category/${product?.id_category}`);
      setCategory(data);
    }
    fetchCategory();
  }, [product]);

  const allImages = product?.photo_library ?? []

  const handleWhatsAppOrder = async () => {
    if (!auth.isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    if (product?.is_budget) {
      await api.post('request-budget', {
        id_product: product?.id_product,
        id_user: user!.id_user,
        description: quoteNote,
      })
    }


    const productUrl = window.location.href;
    let message = `Olá! Gostaria de saber mais sobre o produto: *${product?.title}*.`;

    const contact = enterprise?.phones.find(p => p.is_whatsapp)?.phone;

    if (product?.service && includeService) {
      message += `\nGostaria de incluir o serviço: *${product.service.title}*.`;
    }

    if (quoteNote.trim()) {
      message += `\n\nObservações:\n*${quoteNote}*.`;
    }

    message += `\n\nLink do produto:\n${productUrl}`;
    const whatsappUrl = `https://wa.me/${contact}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAddToCart = async () => {
    if (!auth.isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!product || !selectedPrice) return;

   try {
   const { data } = await api.post('/cart/add-item', {
      id_cart: cart.id_cart,
      id_user: user!.id_user,
      id_product: product.id_product,
      id_price: selectedPrice.id_price,
      quantity: 1
    })

    addToCart({ product, price: selectedPrice, id_item_cart: data.id_item_cart });
    toast.success('Produto adicionado ao carrinho!', {
        className: 'z'
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Erro ao adicionar produto ao carrinho!');
   }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Produto não encontrado</h2>
        <Link to={`/${name_store}`} className="text-primary hover:text-primary/90 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para a lista de produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center bg-white">
      <div className=" overflow-hidden max-w-6xl">
        <div className="p-6  border-b ">
          <Link to={`/${name_store}`} className="text-primary hover:text-primary/90 flex items-center mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a lista de produtos
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{product?.title || 'Loading...'}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
          <div className="space-y-6">
            {isLoading ? (
              <div className="relative rounded-lg overflow-hidden">
                <div className="w-full h-96 bg-gray-200 animate-pulse"></div>
                <div className="absolute top-4 right-4">
                  <div className="w-20 h-8 bg-gray-300 rounded-md animate-pulse"></div>
                </div>
                <div className="absolute bottom-4 right-4">
                  <div className="w-24 h-8 bg-gray-300 rounded-md animate-pulse"></div>
                </div>
              </div>
            ) : product?.photo_library ? (
              <div
                className="relative rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setShowGallery(true)}
              >
                <img
                  src={product.photo_library.find(photo => photo.is_default)?.location || 'https://placehold.co/600x400'}
                  alt={product.title}
                  className="w-full h-auto object-cover"
                />

                {product.photo_library && product.photo_library.length > 0 && (
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-md text-sm">
                    +{product.photo_library.length} Mais imagens
                  </div>
                )}
              </div>
            ) : null}

            <div className="bg-gray-50 rounded-lg p-6 ">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Características do produto</h3>
              <ul className="space-y-3">
                {product.details_point.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Descrição</h2>
              <p className="text-gray-700">{product.description}</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Opções de preço</h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                {product.is_budget ? (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="quote-note" className="text-sm font-medium text-gray-700">
                          Observações para o orçamento
                        </label>
                        <Textarea
                          id="quote-note"
                          placeholder="Adicione observações importantes para o seu orçamento..."
                          value={quoteNote}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuoteNote(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="flex gap-4">
                        <Button
                          onClick={handleWhatsAppOrder}
                          className="flex-1 text-white"
                        >
                          <MessageCircle className="w-5 h-5 mr-2" />
                          Solicitar Orçamento
                        </Button>
                      </div>
                    </div>
                    {product.service && (
                      <div className="mt-6 border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Serviço Vinculado</h3>
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="flex items-center gap-4">
                            {product.service.photo_library && product.service.photo_library.length > 0 && (
                              <div className="w-24 h-24 flex-shrink-0">
                                <img
                                  src={product.service.photo_library.find(photo => photo.is_default)?.location}
                                  alt={product.service.title}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              </div>
                            )}
                            <div className="flex-grow">
                              <h4 className="font-medium text-gray-900">{product.service.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{product.service.description}</p>
                            </div>
                            <div className="flex items-center">
                              <Checkbox
                                id="include-service"
                                checked={includeService}
                                onCheckedChange={(checked: boolean) => setIncludeService(checked)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {product.price.length === 1 ? (
                      <div className="text-2xl font-semibold text-gray-900 mb-4">
                        R$ {product.price[0].value.toFixed(2)}
                      </div>
                    ) : (
                      <Select
                        value={selectedPrice?.id_price}
                        onValueChange={(value: string) => {
                          const price = product.price.find(p => p.id_price === value);
                          if (price) setSelectedPrice(price);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select price" />
                        </SelectTrigger>
                        <SelectContent>
                          {product.price.map((price) => (
                            <SelectItem key={price.id_price} value={price.id_price}>
                              {price.name} - R$ {price.value.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {
                      product?.type === 'service' ? (
                        <div className="flex gap-4">
                          <Button
                            onClick={handleWhatsAppOrder}
                            className="flex-1"
                          >
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Solicitar Serviço
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-4 max-md:flex-col">
                          <Button
                            onClick={handleAddToCart}
                            className="flex-1 text-white"
                            disabled={!selectedPrice && product.price.length > 1}
                          >
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            Adicionar ao Carrinho
                          </Button>
                          <Button
                            onClick={handleWhatsAppOrder}
                            variant="outline"
                            className="flex-1"
                          >
                            <MessageCircle className="w-5 h-5 mr-2" />
                            WhatsApp
                          </Button>
                        </div>
                      )
                    }
                    {product.service && (
                      <div className="mt-6 border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Serviço Vinculado</h3>
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="flex items-center gap-4">
                            {product.service.photo_library && product.service.photo_library.length > 0 && (
                              <div className="w-24 h-24 flex-shrink-0">
                                <img
                                  src={product.service.photo_library.find(photo => photo.is_default)?.location}
                                  alt={product.service.title}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              </div>
                            )}
                            <div className="flex-grow">
                              <h4 className="font-medium text-gray-900">{product.service.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{product.service.description}</p>
                            </div>
                            <div className="flex items-center">
                              <Checkbox
                                id="include-service"
                                checked={includeService}
                                onCheckedChange={(checked: boolean) => setIncludeService(checked)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Detalhes do produto</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Categoria</dt>
                  <dd className="text-gray-900 font-medium">
                    {category?.name}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Adicionado em</dt>
                  <dd className="text-gray-900 font-medium">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Atualizado em</dt>
                  <dd className="text-gray-900 font-medium">
                    {new Date(product.updatedAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
      {showGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full max-w-6xl mx-4">
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative">
              <img
                src={allImages[currentImageIndex].location}
                alt={`Product image ${currentImageIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />

              {allImages.length > 1 && (
                <>
                  <button
                    onClick={previousImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}
            </div>

            <div className="flex justify-center mt-4 gap-2">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full ${currentImageIndex === index ? 'bg-white' : 'bg-gray-500'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default ProductDetail;