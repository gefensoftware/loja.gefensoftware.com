// Tipos espelhando os DTOs da API Go. Confira cada campo contra
// internal/adapters/in/http/catalog_dto.go, cart_dto.go, enterprise_dto.go e
// dto.go no repositório da API antes de alterar: um nome divergente aqui só
// aparece em tempo de execução.
//
// Valores monetários são `string`, nunca `number` — a API serializa
// domain.Money como string decimal e o cliente não deve arredondar por
// conta própria.

export type PromotionState = 'active' | 'scheduled' | 'ended';

export interface Promotion {
  value: string;
  startsAt: string;
  endsAt: string;
  state: PromotionState;
}

export interface Price {
  id: string;
  name: string;
  value: string;
  promotion: Promotion | null;
}

export interface ProductImage {
  id: string;
  url: string;
  isMain: boolean;
  // A ordenação da galeria vem daqui (productImageDTO.position). Sem o campo
  // declarado, ela chega do servidor invisível ao TypeScript e some no
  // primeiro mapeamento.
  position: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  code: number;
  title: string;
  description: string;
  type: 'product' | 'service';
  status: 'active' | 'inactive' | 'paused';
  isBudget: boolean;
  forSchedule: boolean;
  detailsPoint: string[];
  // `extra` é um mapa livre (productResponse.Extra é map[string]any); a API
  // devolve `{}` quando vazio, nunca nulo.
  extra: Record<string, unknown>;
  category: { id: string; name: string } | null;
  // Vínculo com o serviço que o produto atende (serviceRefDTO), nulo quando
  // não há.
  service: { id: string; title: string } | null;
  prices: Price[];
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

// Versão resumida do produto, devolvida pela listagem (productSummaryResponse
// em catalog_dto.go).
export interface ProductSummary {
  id: string;
  code: number;
  title: string;
  type: 'product' | 'service';
  status: 'active' | 'inactive' | 'paused';
  isBudget: boolean;
  createdAt: string;
}

export interface Paged<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CartItem {
  id: string;
  quantity: number;
  product: { id: string; code: number; title: string; status: Product['status']; image: ProductImage | null };
  price: Price;
  effectiveValue: string;
  lineTotal: string;
}

export interface Cart {
  enterpriseId: string;
  items: CartItem[];
  total: string;
}

/** Uma linha do carrinho local, antes de existir no servidor. */
export interface CartLine {
  productId: string;
  priceId: string;
  quantity: number;
}

export interface DroppedLine {
  productId: string;
  priceId: string;
  reason: 'produto-inativo' | 'produto-de-outra-empresa' | 'preco-inexistente';
}

export interface MergeResult {
  cart: Cart;
  dropped: DroppedLine[];
}

// --- Empresa (enterprise_dto.go) ---

export interface Address {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  lat: number | null;
  lng: number | null;
}

export interface ContactEmail {
  // `id,omitempty` no DTO: a API omite o campo quando vazio.
  id?: string;
  name: string;
  email: string;
}

export interface ContactPhone {
  // `id,omitempty` no DTO: a API omite o campo quando vazio.
  id?: string;
  name: string;
  phone: string;
  isWhatsapp: boolean;
}

export interface Palette {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

export interface Theme {
  isDark: boolean;
  light: Palette;
  dark: Palette;
}

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface BusinessHourSlot {
  open: string;
  close: string;
}

export interface BusinessDay {
  day: Weekday;
  isClosed: boolean;
  slots: BusinessHourSlot[];
}

export interface AdminRef {
  id: string;
  name: string;
  email: string;
}

// OperationMode é como a loja trabalha, e é o que dá nome às coisas na
// vitrine: `products` fala "Carrinho" e "Finalizar compra", `services` fala
// "Orçamento", `maintenance` fala "Solicitação de serviço" e "Equipamento".
// Ver src/lib/vocabulario.ts — o texto vive lá, não na API.
//
// `null` é um estado real, e não um descuido: a loja existe e o lojista
// ainda não escolheu o perfil no portal. A vitrine lê o nulo como
// `products`, que é o que toda loja mostra hoje.
export type OperationMode = 'products' | 'services' | 'maintenance';

// Capabilities é o que a loja tem ligado. Espelha `capabilitiesDTO` em
// internal/adapters/in/http/enterprise_dto.go.
//
// É o que decide se o ícone do carrinho existe, se o botão de pedir preço
// aparece e se o seletor de horário é mostrado. As marcações por produto
// (`isBudget`, `forSchedule`) continuam decidindo item a item DENTRO do que
// a loja ligou.
export interface Capabilities {
  cart: boolean;
  budgets: boolean;
  appointments: boolean;
  workOrders: boolean;
}

export interface Enterprise {
  id: string;
  name: string;
  tradeName: string;
  slug: string;
  description: string;
  cnpj: string;
  active: boolean;
  address: Address;
  logoUrl: string;
  bannerUrl: string;
  emails: ContactEmail[];
  phones: ContactPhone[];
  theme: Theme;
  hours: BusinessDay[];
  mode: OperationMode | null;
  capabilities: Capabilities;
  // Só presente quando o chamador tem permissão para ver administradores
  // (a rota pública nunca inclui).
  admins?: AdminRef[];
  createdAt: string;
  updatedAt: string;
}
