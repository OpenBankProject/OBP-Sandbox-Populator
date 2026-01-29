#!/usr/bin/env python3
"""
OBP Sandbox Populator

Creates sandbox data in an Open Bank Project instance:
- 2 Banks (with bank_id prefixed by authenticated user's username)
- 5 Accounts per bank (owned by authenticated user)
- Counterparties representing small businesses in Botswana
"""
import sys
from typing import Optional
from obp_client import OBPClient
from data.botswana_businesses import get_businesses, get_business_for_counterparty
import config


def get_username_prefix(client: OBPClient) -> tuple:
    """
    Get the current user's username to use as prefix for bank IDs

    Returns:
        Tuple of (username_prefix, user_id)
    """
    user = client.get_current_user()
    username = user.get("username", "unknown")
    user_id = user.get("user_id")
    # Clean username to be valid for bank_id (alphanumeric and dots)
    clean_username = "".join(c if c.isalnum() else "." for c in username)
    return (clean_username.lower(), user_id)


def create_banks(client: OBPClient, username: str, count: int = 2) -> list:
    """
    Create banks with IDs prefixed by username

    Args:
        client: OBP API client
        username: Username to prefix bank IDs
        count: Number of banks to create

    Returns:
        List of created bank data
    """
    banks = []
    bank_definitions = [
        {
            "suffix": "commercial.bw",
            "full_name": "Commercial Bank of Botswana",
            "short_name": "CBB",
            "website": "https://www.cbb.co.bw"
        },
        {
            "suffix": "savings.bw",
            "full_name": "Botswana Savings Bank",
            "short_name": "BSB",
            "website": "https://www.bsb.co.bw"
        }
    ]

    for i in range(min(count, len(bank_definitions))):
        bank_def = bank_definitions[i]
        bank_id = f"{username}.{bank_def['suffix']}"

        print(f"Creating bank: {bank_id}")

        # Check if bank already exists
        if client.bank_exists(bank_id):
            print(f"  Bank {bank_id} already exists, skipping...")
            try:
                bank = client.get_bank(bank_id)
                banks.append(bank)
            except Exception as e:
                print(f"  Warning: Could not fetch existing bank: {e}")
            continue

        try:
            bank = client.create_bank(
                bank_id=bank_id,
                full_name=bank_def["full_name"],
                short_name=bank_def["short_name"],
                website=bank_def["website"],
                bank_routings=[
                    {
                        "scheme": "BIC",
                        "address": f"{bank_def['short_name']}BWGX"
                    }
                ]
            )
            print(f"  Created bank: {bank.get('full_name', bank_id)}")
            banks.append(bank)
        except Exception as e:
            print(f"  Error creating bank {bank_id}: {e}")

    return banks


def create_accounts(client: OBPClient, bank_id: str, user_id: str,
                    count: int = 5, currency: str = "BWP") -> list:
    """
    Create accounts at a bank

    Args:
        client: OBP API client
        bank_id: Bank ID to create accounts at
        user_id: User ID who will own the accounts
        count: Number of accounts to create
        currency: Currency code for accounts

    Returns:
        List of created account data
    """
    accounts = []
    account_definitions = [
        {"label": "Current Account", "product_code": "CURRENT"},
        {"label": "Savings Account", "product_code": "SAVINGS"},
        {"label": "Business Account", "product_code": "BUSINESS"},
        {"label": "Investment Account", "product_code": "INVESTMENT"},
        {"label": "Emergency Fund", "product_code": "SAVINGS"},
    ]

    for i in range(min(count, len(account_definitions))):
        acct_def = account_definitions[i]
        label = f"{acct_def['label']} {i + 1}"

        print(f"  Creating account: {label}")

        try:
            account = client.create_account(
                bank_id=bank_id,
                label=label,
                currency=currency,
                user_id=user_id,
                product_code=acct_def["product_code"]
            )
            print(f"    Created account: {account.get('account_id', 'unknown')}")
            accounts.append(account)
        except Exception as e:
            print(f"    Error creating account {label}: {e}")

    return accounts


def create_counterparties(client: OBPClient, bank_id: str, account_id: str,
                          businesses: list, currency: str = "BWP") -> list:
    """
    Create counterparties for an account

    Args:
        client: OBP API client
        bank_id: Bank ID
        account_id: Account ID to add counterparties to
        businesses: List of business data to create as counterparties
        currency: Currency code

    Returns:
        List of created counterparty data
    """
    counterparties = []

    for business in businesses:
        cp_data = get_business_for_counterparty(business, currency)

        print(f"    Creating counterparty: {cp_data['name']}")

        try:
            counterparty = client.create_counterparty(
                bank_id=bank_id,
                account_id=account_id,
                name=cp_data["name"],
                description=cp_data["description"],
                currency=cp_data["currency"],
                other_account_routing_scheme=cp_data["other_account_routing_scheme"],
                other_account_routing_address=cp_data["other_account_routing_address"],
                other_bank_routing_scheme=cp_data["other_bank_routing_scheme"],
                other_bank_routing_address=cp_data["other_bank_routing_address"],
                bespoke=cp_data["bespoke"]
            )
            print(f"      Created counterparty: {counterparty.get('counterparty_id', 'unknown')}")
            counterparties.append(counterparty)
        except Exception as e:
            print(f"      Error creating counterparty {cp_data['name']}: {e}")

    return counterparties


def populate_sandbox(token: Optional[str] = None):
    """
    Main function to populate the OBP sandbox

    Args:
        token: Optional DirectLogin token (uses config if not provided)
    """
    print("=" * 60)
    print("OBP Sandbox Populator")
    print("=" * 60)
    print(f"Target: {config.OBP_BASE_URL}")
    print()

    # Initialize client
    client = OBPClient(token=token)

    # Get current user info
    print("Getting current user info...")
    try:
        username, user_id = get_username_prefix(client)
        print(f"Authenticated as: {username} (ID: {user_id})")
        print(f"Bank ID prefix: {username}")
    except Exception as e:
        print(f"Error: Could not get current user. Is authentication configured?")
        print(f"Details: {e}")
        sys.exit(1)

    print()

    # Create banks
    print("Creating banks...")
    print("-" * 40)
    banks = create_banks(client, username, config.NUM_BANKS)
    print(f"Created {len(banks)} banks")
    print()

    # Get Botswana businesses for counterparties
    # Distribute businesses across accounts
    all_businesses = get_businesses()
    businesses_per_account = len(all_businesses) // (config.NUM_BANKS * config.NUM_ACCOUNTS_PER_BANK)
    if businesses_per_account < 1:
        businesses_per_account = 1

    # Create accounts and counterparties for each bank
    business_idx = 0
    for bank in banks:
        bank_id = bank.get("id") or bank.get("bank_id")
        if not bank_id:
            print(f"Warning: Could not get bank_id from bank data: {bank}")
            continue

        print(f"Creating accounts for bank: {bank_id}")
        print("-" * 40)

        accounts = create_accounts(
            client, bank_id, user_id,
            config.NUM_ACCOUNTS_PER_BANK, config.CURRENCY
        )

        # Add counterparties to the first account of each bank
        if accounts:
            first_account = accounts[0]
            account_id = first_account.get("account_id")

            if account_id:
                # Get a slice of businesses for this account
                end_idx = min(business_idx + businesses_per_account * 2, len(all_businesses))
                account_businesses = all_businesses[business_idx:end_idx]
                business_idx = end_idx

                print(f"  Adding counterparties to account: {account_id}")
                counterparties = create_counterparties(
                    client, bank_id, account_id,
                    account_businesses, config.CURRENCY
                )
                print(f"  Created {len(counterparties)} counterparties")

        print()

    print("=" * 60)
    print("Sandbox population complete!")
    print("=" * 60)


if __name__ == "__main__":
    # Check if token is provided as command line argument
    token = sys.argv[1] if len(sys.argv) > 1 else None
    populate_sandbox(token)
