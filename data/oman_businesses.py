"""
Sample small businesses in Oman for counterparty data

These represent typical small businesses that might be counterparties
for banking transactions in Oman.
"""

# Oman Small Businesses Data
# Each business has a name, description, category, and location
OMAN_BUSINESSES = [
    {
        "name": "Muttrah Souq Frankincense",
        "description": "Frankincense and traditional perfumes",
        "category": "Retail - Perfumes",
        "location": "Muscat",
        "account_number": "OM0001000001",
        "bank_code": "BMUSOMRX"
    },
    {
        "name": "Nizwa Pottery Works",
        "description": "Handmade traditional Omani pottery",
        "category": "Retail - Arts & Crafts",
        "location": "Nizwa",
        "account_number": "OM0001000002",
        "bank_code": "NBOMOMRX"
    },
    {
        "name": "Dhofar Coconut Traders",
        "description": "Coconut and tropical produce supplier",
        "category": "Agriculture - Produce",
        "location": "Salalah",
        "account_number": "OM0001000003",
        "bank_code": "BDOFOMRU"
    },
    {
        "name": "Sur Dhow Builders",
        "description": "Traditional wooden boat building",
        "category": "Manufacturing - Marine",
        "location": "Sur",
        "account_number": "OM0001000004",
        "bank_code": "BMUSOMRX"
    },
    {
        "name": "Al Batinah Date Farms",
        "description": "Date cultivation and packaging",
        "category": "Agriculture - Dates",
        "location": "Sohar",
        "account_number": "OM0001000005",
        "bank_code": "NBOMOMRX"
    },
    {
        "name": "Wahiba Sands Desert Camps",
        "description": "Desert tourism and camping",
        "category": "Tourism",
        "location": "Bidiyah",
        "account_number": "OM0001000006",
        "bank_code": "BDOFOMRU"
    },
    {
        "name": "Muscat Fish Market Co",
        "description": "Fresh seafood wholesale",
        "category": "Food Processing",
        "location": "Muscat",
        "account_number": "OM0001000007",
        "bank_code": "BMUSOMRX"
    },
    {
        "name": "Jebel Akhdar Rose Water",
        "description": "Rose water distillation and sales",
        "category": "Agriculture - Floriculture",
        "location": "Jebel Akhdar",
        "account_number": "OM0001000008",
        "bank_code": "NBOMOMRX"
    },
    {
        "name": "Duqm Logistics LLC",
        "description": "Port logistics and freight forwarding",
        "category": "Transport & Logistics",
        "location": "Duqm",
        "account_number": "OM0001000009",
        "bank_code": "BDOFOMRU"
    },
    {
        "name": "Qurum Tech Solutions LLC",
        "description": "Software and IT consulting",
        "category": "Technology Services",
        "location": "Muscat",
        "account_number": "OM0001000010",
        "bank_code": "BMUSOMRX"
    }
]


def get_businesses(count: int = None) -> list:
    """
    Get list of Oman businesses

    Args:
        count: Number of businesses to return. If None, returns all.

    Returns:
        List of business dictionaries
    """
    if count is None:
        return OMAN_BUSINESSES
    return OMAN_BUSINESSES[:count]
