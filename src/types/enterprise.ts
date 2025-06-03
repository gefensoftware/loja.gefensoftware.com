export type Address = {
  id_address: string;
  id_user: string | null;
  id_product: string | null;
  id_enterprise: string | null;
  street: string;
  number: number;
  complement: string;
  neighborhood: string;
  city: string;
  uf: string;
  lat: number | null;
  lng: number | null;
  zipcode: string;
  country: string;
};

export type Image = {
  id_image: string,
  key: string,
  location: string,
  mimetype: string,
  size: number,
  originalname: string,
  id_product: string
}


type EnterpriseEmail = {
  id_enterprise_email: string;
  id_enterprise: string;
  name: string;
  email: string;
};

type EnterprisePhone = {
  id_enterprise_phone: string;
  id_enterprise: string;
  name: string;
  phone: string;
  is_whatsapp: boolean;
};

type EnterpriseTheme = {
  id_enterprise_theme: string;
  id_enterprise: string;
  light_primary_color: string;
  light_secondary_color: string;
  light_background_color: string;
  light_text_color: string;
  dark_primary_color: string;
  dark_secondary_color: string;
  dark_background_color: string;
  dark_text_color: string;
  createdAt: string;
  updatedAt: string;
};

export interface ScheduleTimeSlot {
  id: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}


export type BusinessDay = {
  id_business_day: string;
  day_of_week: string;
  is_closed: boolean;
  business_hours: ScheduleTimeSlot[];
  is_open: boolean;
}


export type Enterprise = {
  id_enterprise: string;
  id_address: string;
  id_image: string;
  id_image_banner: string | null;
  name: string;
  name_fantasy: string;
  description: string;
  cnpj: string;
  address: Address;
  logo: Image;
  banner: Image | null;
  emails: EnterpriseEmail[];
  phones: EnterprisePhone[];
  theme: EnterpriseTheme;
  business_days: BusinessDay[];
};