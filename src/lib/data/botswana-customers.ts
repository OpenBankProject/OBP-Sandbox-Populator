/**
 * Sample customers in Botswana for sandbox population
 *
 * Individual customers and corporate customers for OBP sandbox testing.
 */

import type { CreateCustomerPayload, CreateCorporateCustomerPayload } from '$lib/obp/types';

export interface IndividualCustomerData {
	legal_name: string;
	mobile_phone_number: string;
	email: string;
	date_of_birth: string;
	title: string;
	employment_status: string;
	highest_education_attained: string;
	relationship_status: string;
}

export interface CorporateCustomerData {
	legal_name: string;
	mobile_phone_number: string;
	email: string;
	category: string;
}

export const INDIVIDUAL_CUSTOMERS: IndividualCustomerData[] = [
	{
		legal_name: 'Kelebogile Modise',
		mobile_phone_number: '+267 71 234 5601',
		email: 'k.modise@example.bw',
		date_of_birth: '1985-03-15',
		title: 'Ms.',
		employment_status: 'employed',
		highest_education_attained: 'Bachelor',
		relationship_status: 'single'
	},
	{
		legal_name: 'Tebogo Molefe',
		mobile_phone_number: '+267 72 345 6702',
		email: 't.molefe@example.bw',
		date_of_birth: '1978-11-22',
		title: 'Mr.',
		employment_status: 'employed',
		highest_education_attained: 'Master',
		relationship_status: 'married'
	},
	{
		legal_name: 'Naledi Ramotswe',
		mobile_phone_number: '+267 73 456 7803',
		email: 'n.ramotswe@example.bw',
		date_of_birth: '1992-07-08',
		title: 'Mrs.',
		employment_status: 'self-employed',
		highest_education_attained: 'Diploma',
		relationship_status: 'married'
	},
	{
		legal_name: 'Mpho Seretse',
		mobile_phone_number: '+267 74 567 8904',
		email: 'm.seretse@example.bw',
		date_of_birth: '1990-01-30',
		title: 'Mr.',
		employment_status: 'employed',
		highest_education_attained: 'Bachelor',
		relationship_status: 'single'
	},
	{
		legal_name: 'Boitumelo Kgosi',
		mobile_phone_number: '+267 75 678 9005',
		email: 'b.kgosi@example.bw',
		date_of_birth: '1988-09-12',
		title: 'Dr.',
		employment_status: 'employed',
		highest_education_attained: 'Doctorate',
		relationship_status: 'married'
	}
];

export const CORPORATE_CUSTOMERS: CorporateCustomerData[] = [
	{
		legal_name: 'Kalahari Mining Holdings (Pty) Ltd',
		mobile_phone_number: '+267 31 234 5601',
		email: 'info@kalahariholdings.example.bw',
		category: 'Mining'
	},
	{
		legal_name: 'Okavango Agri-Business Corp',
		mobile_phone_number: '+267 31 345 6702',
		email: 'contact@okavangoagri.example.bw',
		category: 'Agriculture'
	},
	{
		legal_name: 'Gaborone Tech Solutions (Pty) Ltd',
		mobile_phone_number: '+267 31 456 7803',
		email: 'hello@gabtech.example.bw',
		category: 'Technology'
	},
	{
		legal_name: 'Chobe Hospitality Group',
		mobile_phone_number: '+267 31 567 8904',
		email: 'reservations@chobehg.example.bw',
		category: 'Tourism & Hospitality'
	},
	{
		legal_name: 'Botswana Solar Energy Ltd',
		mobile_phone_number: '+267 31 678 9005',
		email: 'sales@bwsolar.example.bw',
		category: 'Energy'
	}
];

export function getIndividualCustomers(count?: number): IndividualCustomerData[] {
	if (count === undefined) return INDIVIDUAL_CUSTOMERS;
	return INDIVIDUAL_CUSTOMERS.slice(0, count);
}

export function getCorporateCustomers(count?: number): CorporateCustomerData[] {
	if (count === undefined) return CORPORATE_CUSTOMERS;
	return CORPORATE_CUSTOMERS.slice(0, count);
}

export function toCreateCustomerPayload(
	data: IndividualCustomerData,
	currency: string = 'BWP'
): CreateCustomerPayload {
	return {
		legal_name: data.legal_name,
		mobile_phone_number: data.mobile_phone_number,
		email: data.email,
		date_of_birth: data.date_of_birth,
		title: data.title,
		employment_status: data.employment_status,
		highest_education_attained: data.highest_education_attained,
		relationship_status: data.relationship_status,
		kyc_status: true,
		credit_limit: { currency, amount: '10000' },
		credit_rating: { rating: 'A', source: 'OBP' },
		last_ok_date: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
	};
}

export function toCreateCorporateCustomerPayload(
	data: CorporateCustomerData,
	currency: string = 'BWP'
): CreateCorporateCustomerPayload {
	return {
		legal_name: data.legal_name,
		mobile_phone_number: data.mobile_phone_number,
		email: data.email,
		kyc_status: true,
		credit_limit: { currency, amount: '500000' },
		credit_rating: { rating: 'AA', source: 'OBP' },
		last_ok_date: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
	};
}
