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
        self.session.headers.update({"Content-Type": "application/json"})

        # If no token provided, try to login with username/password
        if not self.token:
            self._login_with_credentials()
        else:
            self._set_auth_header()

    def _set_auth_header(self):
        """Set the authorization header with the current token"""
        if self.token:
            self.session.headers.update({
                "Authorization": f"DirectLogin token=\"{self.token}\""
            })

    def _login_with_credentials(self):
        """Login using username, password, and consumer key to get a token"""
        username = config.OBP_USERNAME
        password = config.OBP_PASSWORD
        consumer_key = config.OBP_CONSUMER_KEY

        if not all([username, password, consumer_key]):
            return  # No credentials configured

        auth_header = f'DirectLogin username="{username}",password="{password}",consumer_key="{consumer_key}"'

        response = requests.post(
            f"{self.base_url}/my/logins/direct",
            headers={
                "Authorization": auth_header,
                "Content-Type": "application/json"
            }
        )

        if response.status_code == 201:
            data = response.json()
            self.token = data.get("token")
            self._set_auth_header()
            print(f"Successfully logged in as: {username}")
        else:
            raise Exception(f"Login failed: {response.status_code} - {response.text}")

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
                    bank_code: str = "", logo: str = "", website: str = "",
                    bank_routings: list = None) -> dict:
        """
        Create a new bank

        Args:
            bank_id: Unique identifier for the bank (e.g., "username.bank1.bw")
            full_name: Full name of the bank
            short_name: Short name/code for the bank
            bank_code: Bank code (e.g., "CBBW")
            logo: URL to bank logo
            website: Bank website URL
            bank_routings: List of bank routing info
        """
        payload = {
            "bank_id": bank_id,
            "full_name": full_name,
            "short_name": short_name,
            "bank_code": bank_code or short_name,
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

    # FX Rate endpoints
    def create_fx_rate(self, bank_id: str, from_currency: str, to_currency: str,
                       conversion_value: float, inverse_conversion_value: float = None) -> dict:
        """
        Create or update an FX rate for a bank

        Args:
            bank_id: Bank ID
            from_currency: Source currency code (e.g., "EUR")
            to_currency: Target currency code (e.g., "BWP")
            conversion_value: Conversion rate (e.g., 1 EUR = X BWP)
            inverse_conversion_value: Inverse rate (calculated if not provided)

        Returns:
            FX rate response
        """
        from datetime import datetime

        if inverse_conversion_value is None:
            inverse_conversion_value = 1.0 / conversion_value

        payload = {
            "bank_id": bank_id,
            "from_currency_code": from_currency,
            "to_currency_code": to_currency,
            "conversion_value": conversion_value,
            "inverse_conversion_value": inverse_conversion_value,
            "effective_date": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
        }
        response = self.session.put(self._url(f"/banks/{bank_id}/fx"), json=payload)
        return self._handle_response(response)

    # Historical Transaction endpoints
    def create_historical_transaction(self, bank_id: str, from_account_id: str,
                                       to_account_id: str, amount: str, currency: str,
                                       description: str, posted: str, completed: str,
                                       transaction_type: str = "SANDBOX_TAN",
                                       charge_policy: str = "SHARED") -> dict:
        """
        Create a historical transaction between two accounts at the same bank

        Args:
            bank_id: Bank ID
            from_account_id: Source account ID
            to_account_id: Destination account ID
            amount: Transaction amount
            currency: Currency code
            description: Transaction description
            posted: Posted date (ISO format: "2024-01-15T10:30:00Z")
            completed: Completed date (ISO format: "2024-01-15T10:30:00Z")
            transaction_type: Transaction type (default: "SANDBOX_TAN")
            charge_policy: Charge policy (default: "SHARED")

        Returns:
            Historical transaction response
        """
        payload = {
            "from_account_id": from_account_id,
            "to_account_id": to_account_id,
            "value": {
                "currency": currency,
                "amount": amount
            },
            "description": description,
            "posted": posted,
            "completed": completed,
            "type": transaction_type,
            "charge_policy": charge_policy
        }
        response = self.session.post(
            self._url(f"/banks/{bank_id}/management/historical/transactions"),
            json=payload
        )
        return self._handle_response(response)

    # Transaction Request endpoints
    def create_transaction_request_account(self, from_bank_id: str, from_account_id: str,
                                           to_bank_id: str, to_account_id: str,
                                           amount: str, currency: str,
                                           description: str,
                                           view_id: str = "owner") -> dict:
        """
        Create a transaction request to transfer money between accounts

        Args:
            from_bank_id: Source bank ID
            from_account_id: Source account ID
            to_bank_id: Destination bank ID
            to_account_id: Destination account ID
            amount: Amount to transfer
            currency: Currency code
            description: Transaction description
            view_id: View ID (usually "owner")

        Returns:
            Transaction request response
        """
        payload = {
            "to": {
                "bank_id": to_bank_id,
                "account_id": to_account_id
            },
            "value": {
                "currency": currency,
                "amount": amount
            },
            "description": description
        }
        response = self.session.post(
            self._url(f"/banks/{from_bank_id}/accounts/{from_account_id}/{view_id}/transaction-request-types/ACCOUNT/transaction-requests"),
            json=payload
        )
        return self._handle_response(response)
