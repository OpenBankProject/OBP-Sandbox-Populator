"""
OBP API Client for interacting with Open Bank Project API
"""
import requests
from typing import Optional
import config


class OBPClient:
    """Client for interacting with the Open Bank Project API"""

    def __init__(self, base_url: str = None, api_version: str = None, token: str = None):
        self.base_url = base_url or config.OBP_BASE_URL
        self.api_version = api_version or config.OBP_API_VERSION
        self.token = token or config.OBP_DIRECT_LOGIN_TOKEN
        self.session = requests.Session()
        self._setup_session()

    def _setup_session(self):
        """Setup session with authentication headers"""
        if self.token:
            self.session.headers.update({
                "Authorization": f"DirectLogin token=\"{self.token}\"",
                "Content-Type": "application/json"
            })

    def _url(self, path: str) -> str:
        """Build full URL for API endpoint"""
        return f"{self.base_url}/obp/{self.api_version}{path}"

    def _handle_response(self, response: requests.Response) -> dict:
        """Handle API response and raise errors if needed"""
        if response.status_code >= 400:
            error_msg = f"API Error {response.status_code}: {response.text}"
            raise Exception(error_msg)
        return response.json()

    # User endpoints
    def get_current_user(self) -> dict:
        """Get the currently authenticated user"""
        response = self.session.get(self._url("/users/current"))
        return self._handle_response(response)

    # Bank endpoints
    def get_banks(self) -> dict:
        """Get list of all banks"""
        response = self.session.get(self._url("/banks"))
        return self._handle_response(response)

    def get_bank(self, bank_id: str) -> dict:
        """Get a specific bank by ID"""
        response = self.session.get(self._url(f"/banks/{bank_id}"))
        return self._handle_response(response)

    def create_bank(self, bank_id: str, full_name: str, short_name: str,
                    logo: str = "", website: str = "", bank_routings: list = None) -> dict:
        """
        Create a new bank

        Args:
            bank_id: Unique identifier for the bank (e.g., "username.bank1.bw")
            full_name: Full name of the bank
            short_name: Short name/code for the bank
            logo: URL to bank logo
            website: Bank website URL
            bank_routings: List of bank routing info
        """
        payload = {
            "id": bank_id,
            "full_name": full_name,
            "short_name": short_name,
            "logo": logo,
            "website": website,
            "bank_routings": bank_routings or []
        }
        response = self.session.post(self._url("/banks"), json=payload)
        return self._handle_response(response)

    # Account endpoints
    def get_accounts_at_bank(self, bank_id: str) -> dict:
        """Get all accounts at a specific bank"""
        response = self.session.get(self._url(f"/banks/{bank_id}/accounts"))
        return self._handle_response(response)

    def create_account(self, bank_id: str, label: str, currency: str,
                       balance_amount: str = "0", user_id: str = None,
                       product_code: str = "", branch_id: str = "",
                       account_routings: list = None) -> dict:
        """
        Create a new account at a bank

        Args:
            bank_id: The bank ID where the account will be created
            label: Account label/name
            currency: Currency code (e.g., "BWP" for Botswana Pula)
            balance_amount: Initial balance (must be "0" for creation)
            user_id: User ID who will own the account (optional, defaults to current user)
            product_code: Product code for the account type
            branch_id: Branch ID
            account_routings: List of account routing info
        """
        payload = {
            "label": label,
            "currency": currency,
            "balance": {
                "amount": balance_amount,
                "currency": currency
            },
            "product_code": product_code,
            "branch_id": branch_id,
            "account_routings": account_routings or []
        }
        if user_id:
            payload["user_id"] = user_id

        response = self.session.post(self._url(f"/banks/{bank_id}/accounts"), json=payload)
        return self._handle_response(response)

    # Counterparty endpoints
    def get_counterparties(self, bank_id: str, account_id: str, view_id: str = "owner") -> dict:
        """Get counterparties for an account"""
        response = self.session.get(
            self._url(f"/banks/{bank_id}/accounts/{account_id}/{view_id}/counterparties")
        )
        return self._handle_response(response)

    def create_counterparty(self, bank_id: str, account_id: str, name: str,
                            description: str, currency: str,
                            other_account_routing_scheme: str = "IBAN",
                            other_account_routing_address: str = "",
                            other_bank_routing_scheme: str = "BIC",
                            other_bank_routing_address: str = "",
                            is_beneficiary: bool = True,
                            view_id: str = "owner",
                            bespoke: list = None) -> dict:
        """
        Create a counterparty for an account

        Args:
            bank_id: Bank ID of the account
            account_id: Account ID to add the counterparty to
            name: Name of the counterparty (e.g., business name)
            description: Description of the counterparty
            currency: Currency code
            other_account_routing_scheme: Routing scheme (e.g., "IBAN", "AccountNumber")
            other_account_routing_address: The actual routing address/number
            other_bank_routing_scheme: Bank routing scheme (e.g., "BIC", "SWIFT")
            other_bank_routing_address: The bank routing address
            is_beneficiary: Whether this is a beneficiary
            view_id: View ID (usually "owner")
            bespoke: List of custom key-value pairs
        """
        payload = {
            "name": name,
            "description": description,
            "currency": currency,
            "other_account_routing_scheme": other_account_routing_scheme,
            "other_account_routing_address": other_account_routing_address,
            "other_account_secondary_routing_scheme": "",
            "other_account_secondary_routing_address": "",
            "other_bank_routing_scheme": other_bank_routing_scheme,
            "other_bank_routing_address": other_bank_routing_address,
            "other_branch_routing_scheme": "",
            "other_branch_routing_address": "",
            "is_beneficiary": is_beneficiary,
            "bespoke": bespoke or []
        }
        response = self.session.post(
            self._url(f"/banks/{bank_id}/accounts/{account_id}/{view_id}/counterparties"),
            json=payload
        )
        return self._handle_response(response)

    def bank_exists(self, bank_id: str) -> bool:
        """Check if a bank exists"""
        try:
            self.get_bank(bank_id)
            return True
        except Exception:
            return False
