/**
 * Sample small businesses in Botswana for counterparty data
 *
 * These represent typical small businesses that might be counterparties
 * for banking transactions in Botswana.
 */

import type { CreateCounterpartyPayload } from '$lib/obp/types';

export interface Business {
	name: string;
	description: string;
	category: string;
	location: string;
	account_number: string;
	bank_code: string;
}

// Botswana Small Businesses Data
// Each business has a name, description, category, and location
export const BOTSWANA_BUSINESSES: Business[] = [
	{
		name: 'Mokolodi Crafts',
		description: 'Traditional Botswana crafts and artwork',
		category: 'Retail - Arts & Crafts',
		location: 'Gaborone',
		account_number: 'BW0001000001',
		bank_code: 'FNBBBWGX'
	},
	{
		name: 'Kalahari Safari Tours',
		description: 'Wildlife safari and eco-tourism services',
		category: 'Tourism',
		location: 'Maun',
		account_number: 'BW0001000002',
		bank_code: 'SBICBWGX'
	},
	{
		name: 'Botho Fresh Produce',
		description: 'Fresh fruits and vegetables supplier',
		category: 'Agriculture - Produce',
		location: 'Francistown',
		account_number: 'BW0001000003',
		bank_code: 'BABORWGX'
	},
	{
		name: 'Tswana Textiles',
		description: 'Traditional and modern African textiles',
		category: 'Manufacturing - Textiles',
		location: 'Gaborone',
		account_number: 'BW0001000004',
		bank_code: 'FNBBBWGX'
	},
	{
		name: 'Okavango Fish Farm',
		description: 'Sustainable aquaculture and fish supply',
		category: 'Agriculture - Aquaculture',
		location: 'Kasane',
		account_number: 'BW0001000005',
		bank_code: 'SBICBWGX'
	},
	{
		name: 'Setswana Solar Solutions',
		description: 'Solar panel installation and maintenance',
		category: 'Energy - Renewable',
		location: 'Gaborone',
		account_number: 'BW0001000006',
		bank_code: 'BABORWGX'
	},
	{
		name: 'Motswana Mobile Repairs',
		description: 'Mobile phone and electronics repair',
		category: 'Services - Electronics',
		location: 'Lobatse',
		account_number: 'BW0001000007',
		bank_code: 'FNBBBWGX'
	},
	{
		name: 'Chobe Leather Goods',
		description: 'Handcrafted leather products and accessories',
		category: 'Manufacturing - Leather',
		location: 'Kasane',
		account_number: 'BW0001000008',
		bank_code: 'SBICBWGX'
	},
	{
		name: 'Gaborone Catering Services',
		description: 'Event catering and food services',
		category: 'Food & Beverage',
		location: 'Gaborone',
		account_number: 'BW0001000009',
		bank_code: 'BABORWGX'
	},
	{
		name: 'Pula Construction Materials',
		description: 'Building materials and construction supplies',
		category: 'Construction',
		location: 'Francistown',
		account_number: 'BW0001000010',
		bank_code: 'FNBBBWGX'
	},
	{
		name: 'Tlokweng Transport Services',
		description: 'Local freight and logistics services',
		category: 'Transport & Logistics',
		location: 'Tlokweng',
		account_number: 'BW0001000011',
		bank_code: 'SBICBWGX'
	},
	{
		name: 'Botswana Beekeepers Cooperative',
		description: 'Honey production and bee products',
		category: 'Agriculture - Apiculture',
		location: 'Palapye',
		account_number: 'BW0001000012',
		bank_code: 'BABORWGX'
	},
	{
		name: 'Maun Auto Mechanics',
		description: 'Vehicle repair and maintenance services',
		category: 'Automotive Services',
		location: 'Maun',
		account_number: 'BW0001000013',
		bank_code: 'FNBBBWGX'
	},
	{
		name: 'Kgalagadi Pottery Studio',
		description: 'Handmade pottery and ceramics',
		category: 'Arts & Crafts',
		location: 'Molepolole',
		account_number: 'BW0001000014',
		bank_code: 'SBICBWGX'
	},
	{
		name: 'Delta Digital Services',
		description: 'IT support and digital marketing',
		category: 'Technology Services',
		location: 'Gaborone',
		account_number: 'BW0001000015',
		bank_code: 'BABORWGX'
	},
	{
		name: 'Serowe Grain Mills',
		description: 'Grain processing and flour production',
		category: 'Food Processing',
		location: 'Serowe',
		account_number: 'BW0001000016',
		bank_code: 'FNBBBWGX'
	},
	{
		name: 'Nata Salt Mining',
		description: 'Natural salt extraction and processing',
		category: 'Mining - Salt',
		location: 'Nata',
		account_number: 'BW0001000017',
		bank_code: 'SBICBWGX'
	},
	{
		name: 'Botswana Beauty Products',
		description: 'Natural cosmetics and skincare products',
		category: 'Manufacturing - Cosmetics',
		location: 'Gaborone',
		account_number: 'BW0001000018',
		bank_code: 'BABORWGX'
	},
	{
		name: 'Jwaneng Jewelry Workshop',
		description: 'Custom jewelry and diamond polishing',
		category: 'Manufacturing - Jewelry',
		location: 'Jwaneng',
		account_number: 'BW0001000019',
		bank_code: 'FNBBBWGX'
	},
	{
		name: 'Moremi Eco Lodge Supplies',
		description: 'Eco-friendly hospitality supplies',
		category: 'Hospitality Supplies',
		location: 'Maun',
		account_number: 'BW0001000020',
		bank_code: 'SBICBWGX'
	}
];

/**
 * Get list of Botswana businesses
 *
 * @param count - Number of businesses to return. If undefined, returns all.
 * @returns List of business objects
 */
export function getBusinesses(count?: number): Business[] {
	if (count === undefined) {
		return BOTSWANA_BUSINESSES;
	}
	return BOTSWANA_BUSINESSES.slice(0, count);
}

/**
 * Convert business data to counterparty format
 *
 * @param business - Business object
 * @param currency - Currency code (default: BWP for Botswana Pula)
 * @returns Payload formatted for OBP counterparty creation
 */
export function getBusinessForCounterparty(
	business: Business,
	currency: string = 'BWP'
): CreateCounterpartyPayload {
	// Truncate description to max 36 characters (OBP limit)
	const description = business.description.slice(0, 36);

	return {
		name: business.name,
		description: description,
		currency: currency,
		other_account_routing_scheme: 'AccountNumber',
		other_account_routing_address: business.account_number,
		other_bank_routing_scheme: 'BIC',
		other_bank_routing_address: business.bank_code,
		bespoke: [
			{ key: 'category', value: business.category },
			{ key: 'location', value: business.location }
		]
	};
}
