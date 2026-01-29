#!/usr/bin/env python3
"""
OBP Sandbox Populator

Creates sandbox data in an Open Bank Project instance:
- 2 Banks (with bank_id prefixed by authenticated user's username)
- 5 Accounts per bank (owned by authenticated user)
- Counterparties representing small businesses in Botswana
"""
import sys
import random
from datetime import datetime, timedelta
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
    # Truncate to max 8 characters to avoid bank_id being too long
    clean_username = clean_username[:8]
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
            "suffix": "cbb",
            "full_name": "Commercial Bank of Botswana",
            "short_name": "CBB",
            "website": "https://www.cbb.co.bw"
        },
        {
            "suffix": "bsb",
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


def create_fx_rates(client: OBPClient, bank_id: str) -> list:
    """
    Create FX rates for a bank to enable currency conversions

    Args:
        client: OBP API client
        bank_id: Bank ID to create FX rates for

    Returns:
        List of created FX rate data
    """
    fx_rates = []

    # FX rates - Approximate rates as of 2024
    # BWP = Botswana Pula, ZAR = South African Rand, KES = Kenyan Shilling
    # NGN = Nigerian Naira, EGP = Egyptian Pound, GHS = Ghanaian Cedi
    # TZS = Tanzanian Shilling, UGX = Ugandan Shilling, ZMW = Zambian Kwacha
    # NAD = Namibian Dollar, CNY = Chinese Yuan
    rate_definitions = [
        # BWP (Botswana Pula) pairs
        {"from": "EUR", "to": "BWP", "rate": 14.85},
        {"from": "BWP", "to": "EUR", "rate": 0.0673},
        {"from": "USD", "to": "BWP", "rate": 13.65},
        {"from": "BWP", "to": "USD", "rate": 0.0733},
        {"from": "GBP", "to": "BWP", "rate": 17.25},
        {"from": "BWP", "to": "GBP", "rate": 0.0580},

        # ZAR (South African Rand) pairs
        {"from": "EUR", "to": "ZAR", "rate": 20.15},
        {"from": "ZAR", "to": "EUR", "rate": 0.0496},
        {"from": "USD", "to": "ZAR", "rate": 18.50},
        {"from": "ZAR", "to": "USD", "rate": 0.0541},
        {"from": "BWP", "to": "ZAR", "rate": 1.36},
        {"from": "ZAR", "to": "BWP", "rate": 0.735},

        # KES (Kenyan Shilling) pairs
        {"from": "EUR", "to": "KES", "rate": 166.50},
        {"from": "KES", "to": "EUR", "rate": 0.0060},
        {"from": "USD", "to": "KES", "rate": 153.00},
        {"from": "KES", "to": "USD", "rate": 0.0065},

        # NGN (Nigerian Naira) pairs
        {"from": "EUR", "to": "NGN", "rate": 1750.00},
        {"from": "NGN", "to": "EUR", "rate": 0.000571},
        {"from": "USD", "to": "NGN", "rate": 1600.00},
        {"from": "NGN", "to": "USD", "rate": 0.000625},

        # EGP (Egyptian Pound) pairs
        {"from": "EUR", "to": "EGP", "rate": 53.50},
        {"from": "EGP", "to": "EUR", "rate": 0.0187},
        {"from": "USD", "to": "EGP", "rate": 49.00},
        {"from": "EGP", "to": "USD", "rate": 0.0204},

        # GHS (Ghanaian Cedi) pairs
        {"from": "EUR", "to": "GHS", "rate": 17.20},
        {"from": "GHS", "to": "EUR", "rate": 0.0581},
        {"from": "USD", "to": "GHS", "rate": 15.80},
        {"from": "GHS", "to": "USD", "rate": 0.0633},

        # TZS (Tanzanian Shilling) pairs
        {"from": "EUR", "to": "TZS", "rate": 2750.00},
        {"from": "TZS", "to": "EUR", "rate": 0.000364},
        {"from": "USD", "to": "TZS", "rate": 2525.00},
        {"from": "TZS", "to": "USD", "rate": 0.000396},

        # UGX (Ugandan Shilling) pairs
        {"from": "EUR", "to": "UGX", "rate": 4100.00},
        {"from": "UGX", "to": "EUR", "rate": 0.000244},
        {"from": "USD", "to": "UGX", "rate": 3760.00},
        {"from": "UGX", "to": "USD", "rate": 0.000266},

        # ZMW (Zambian Kwacha) pairs
        {"from": "EUR", "to": "ZMW", "rate": 29.50},
        {"from": "ZMW", "to": "EUR", "rate": 0.0339},
        {"from": "USD", "to": "ZMW", "rate": 27.00},
        {"from": "ZMW", "to": "USD", "rate": 0.0370},

        # NAD (Namibian Dollar) pairs
        {"from": "EUR", "to": "NAD", "rate": 20.15},
        {"from": "NAD", "to": "EUR", "rate": 0.0496},
        {"from": "USD", "to": "NAD", "rate": 18.50},
        {"from": "NAD", "to": "USD", "rate": 0.0541},

        # CNY (Chinese Yuan) pairs
        {"from": "EUR", "to": "CNY", "rate": 7.85},
        {"from": "CNY", "to": "EUR", "rate": 0.1274},
        {"from": "USD", "to": "CNY", "rate": 7.20},
        {"from": "CNY", "to": "USD", "rate": 0.1389},
        {"from": "BWP", "to": "CNY", "rate": 0.528},
        {"from": "CNY", "to": "BWP", "rate": 1.894},

        # Major currency pairs
        {"from": "EUR", "to": "USD", "rate": 1.09},
        {"from": "USD", "to": "EUR", "rate": 0.92},
        {"from": "GBP", "to": "USD", "rate": 1.27},
        {"from": "USD", "to": "GBP", "rate": 0.79},
        {"from": "GBP", "to": "EUR", "rate": 1.16},
        {"from": "EUR", "to": "GBP", "rate": 0.86},
    ]

    for rate_def in rate_definitions:
        from_curr = rate_def["from"]
        to_curr = rate_def["to"]
        rate = rate_def["rate"]

        print(f"  Creating FX rate: {from_curr} -> {to_curr} = {rate}")

        try:
            fx_rate = client.create_fx_rate(
                bank_id=bank_id,
                from_currency=from_curr,
                to_currency=to_curr,
                conversion_value=rate
            )
            print(f"    Created FX rate: {from_curr}/{to_curr}")
            fx_rates.append(fx_rate)
        except Exception as e:
            print(f"    Error creating FX rate {from_curr}/{to_curr}: {e}")

    return fx_rates


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


def create_historical_transactions(client: OBPClient, bank_accounts: dict,
                                    currency: str = "BWP",
                                    months: int = 12,
                                    delay_seconds: float = 0.1) -> list:
    """
    Create historical transactions to build up account history

    Args:
        client: OBP API client
        bank_accounts: Dict mapping bank_id to list of account dicts
        currency: Currency code
        months: Number of months of history to create
        delay_seconds: Delay between API requests to avoid rate limiting

    Returns:
        List of created historical transactions
    """
    import time

    transactions = []

    # Transaction templates for realistic patterns
    transaction_templates = [
        # Regular monthly transactions
        {"desc": "Salary deposit", "amount_range": (5000, 15000), "frequency": "monthly"},
        {"desc": "Rent payment", "amount_range": (800, 2500), "frequency": "monthly"},
        {"desc": "Utility bill", "amount_range": (100, 400), "frequency": "monthly"},
        {"desc": "Mobile phone", "amount_range": (50, 150), "frequency": "monthly"},
        {"desc": "Internet service", "amount_range": (80, 200), "frequency": "monthly"},
        {"desc": "Insurance premium", "amount_range": (200, 600), "frequency": "monthly"},

        # Weekly transactions
        {"desc": "Grocery shopping", "amount_range": (150, 500), "frequency": "weekly"},
        {"desc": "Fuel purchase", "amount_range": (100, 300), "frequency": "weekly"},

        # Occasional transactions
        {"desc": "Restaurant dining", "amount_range": (50, 300), "frequency": "biweekly"},
        {"desc": "Online shopping", "amount_range": (100, 800), "frequency": "biweekly"},
        {"desc": "Medical expense", "amount_range": (100, 1000), "frequency": "quarterly"},
        {"desc": "Vehicle maintenance", "amount_range": (200, 1500), "frequency": "quarterly"},
        {"desc": "Clothing purchase", "amount_range": (150, 600), "frequency": "quarterly"},
        {"desc": "Entertainment", "amount_range": (50, 200), "frequency": "biweekly"},
        {"desc": "Savings transfer", "amount_range": (500, 2000), "frequency": "monthly"},
        {"desc": "Investment deposit", "amount_range": (1000, 5000), "frequency": "monthly"},
    ]

    end_date = datetime.now()
    start_date = end_date - timedelta(days=months * 30)

    for bank_id, accounts in bank_accounts.items():
        if len(accounts) < 2:
            continue

        print(f"  Creating historical transactions for bank: {bank_id}")

        # Generate transactions for each month
        current_date = start_date
        tx_count = 0

        while current_date < end_date:
            for template in transaction_templates:
                # Determine if this transaction should occur based on frequency
                should_create = False
                if template["frequency"] == "monthly":
                    should_create = current_date.day == 1
                elif template["frequency"] == "weekly":
                    should_create = current_date.weekday() == 0  # Mondays
                elif template["frequency"] == "biweekly":
                    should_create = current_date.day in [1, 15]
                elif template["frequency"] == "quarterly":
                    should_create = current_date.day == 1 and current_date.month % 3 == 1

                if should_create:
                    # Pick random from and to accounts
                    from_account = random.choice(accounts)
                    to_account = random.choice([a for a in accounts if a["account_id"] != from_account["account_id"]])

                    if not to_account:
                        continue

                    amount = random.uniform(*template["amount_range"])
                    amount_str = f"{amount:.2f}"

                    # Add some random hours/minutes to the timestamp
                    tx_time = current_date.replace(
                        hour=random.randint(8, 18),
                        minute=random.randint(0, 59),
                        second=random.randint(0, 59)
                    )
                    timestamp = tx_time.strftime("%Y-%m-%dT%H:%M:%SZ")

                    try:
                        # Add delay to avoid rate limiting
                        time.sleep(delay_seconds)

                        tx = client.create_historical_transaction(
                            bank_id=bank_id,
                            from_account_id=from_account["account_id"],
                            to_account_id=to_account["account_id"],
                            amount=amount_str,
                            currency=currency,
                            description=template["desc"][:36],  # Truncate to 36 chars
                            posted=timestamp,
                            completed=timestamp
                        )
                        transactions.append(tx)
                        tx_count += 1

                        # Print progress every 50 transactions
                        if tx_count % 50 == 0:
                            print(f"    Progress: {tx_count} transactions created...")

                    except Exception as e:
                        error_msg = str(e)
                        if "429" in error_msg:
                            print(f"    Rate limited at {tx_count} transactions. Waiting 60 seconds...")
                            time.sleep(60)
                            # Retry this transaction
                            try:
                                tx = client.create_historical_transaction(
                                    bank_id=bank_id,
                                    from_account_id=from_account["account_id"],
                                    to_account_id=to_account["account_id"],
                                    amount=amount_str,
                                    currency=currency,
                                    description=template["desc"][:36],
                                    posted=timestamp,
                                    completed=timestamp
                                )
                                transactions.append(tx)
                                tx_count += 1
                            except Exception as retry_e:
                                print(f"    Retry failed: {retry_e}")
                        else:
                            print(f"    Error: {e}")
                            return transactions

            current_date += timedelta(days=1)

        print(f"    Created {tx_count} historical transactions")

    return transactions


def create_transaction_requests(client: OBPClient, all_accounts: list,
                                 currency: str = "BWP") -> list:
    """
    Create transaction requests between accounts

    Args:
        client: OBP API client
        all_accounts: List of all accounts (each with bank_id and account_id)
        currency: Currency code

    Returns:
        List of created transaction request data
    """
    transaction_requests = []

    # Sample transactions to create
    transactions = [
        {"from_idx": 0, "to_idx": 1, "amount": "100.00", "description": "Monthly savings transfer"},
        {"from_idx": 0, "to_idx": 2, "amount": "250.50", "description": "Business expenses"},
        {"from_idx": 1, "to_idx": 3, "amount": "500.00", "description": "Investment deposit"},
        {"from_idx": 2, "to_idx": 0, "amount": "75.25", "description": "Refund payment"},
        {"from_idx": 3, "to_idx": 4, "amount": "1000.00", "description": "Emergency fund top-up"},
        {"from_idx": 5, "to_idx": 0, "amount": "200.00", "description": "Cross-bank transfer"},
        {"from_idx": 6, "to_idx": 1, "amount": "350.00", "description": "Savings deposit"},
        {"from_idx": 0, "to_idx": 7, "amount": "150.00", "description": "Business payment"},
    ]

    for txn in transactions:
        from_idx = txn["from_idx"]
        to_idx = txn["to_idx"]

        if from_idx >= len(all_accounts) or to_idx >= len(all_accounts):
            continue

        from_account = all_accounts[from_idx]
        to_account = all_accounts[to_idx]

        from_bank_id = from_account["bank_id"]
        from_account_id = from_account["account_id"]
        to_bank_id = to_account["bank_id"]
        to_account_id = to_account["account_id"]

        print(f"  Creating transaction: {txn['amount']} {currency} - {txn['description']}")
        print(f"    From: {from_bank_id}/{from_account_id}")
        print(f"    To: {to_bank_id}/{to_account_id}")

        try:
            txn_request = client.create_transaction_request_account(
                from_bank_id=from_bank_id,
                from_account_id=from_account_id,
                to_bank_id=to_bank_id,
                to_account_id=to_account_id,
                amount=txn["amount"],
                currency=currency,
                description=txn["description"]
            )
            txn_id = txn_request.get("id", "unknown")
            status = txn_request.get("status", "unknown")
            print(f"    Created transaction request: {txn_id} (status: {status})")
            transaction_requests.append(txn_request)
        except Exception as e:
            print(f"    Error creating transaction request: {e}")

    return transaction_requests


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

    # Create FX rates for each bank
    print("Creating FX rates...")
    print("-" * 40)
    for bank in banks:
        bank_id = bank.get("id") or bank.get("bank_id")
        if bank_id:
            print(f"FX rates for bank: {bank_id}")
            create_fx_rates(client, bank_id)
    print()

    # Get Botswana businesses for counterparties
    # Distribute businesses across accounts
    all_businesses = get_businesses()
    businesses_per_account = len(all_businesses) // (config.NUM_BANKS * config.NUM_ACCOUNTS_PER_BANK)
    if businesses_per_account < 1:
        businesses_per_account = 1

    # Track all accounts for transaction requests
    all_accounts = []

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

        # Track accounts with their bank_id for transaction requests
        for account in accounts:
            all_accounts.append({
                "bank_id": bank_id,
                "account_id": account.get("account_id"),
                "label": account.get("label")
            })

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

    # Create historical transactions to build account history
    # Group accounts by bank for historical transactions (same-bank only)
    bank_accounts = {}
    for account in all_accounts:
        bank_id = account["bank_id"]
        if bank_id not in bank_accounts:
            bank_accounts[bank_id] = []
        bank_accounts[bank_id].append(account)

    print("Creating historical transactions (past 12 months)...")
    print("-" * 40)
    historical_transactions = create_historical_transactions(
        client, bank_accounts, config.CURRENCY, months=12
    )
    print(f"Created {len(historical_transactions)} historical transactions total")
    print()

    # Create transaction requests between accounts
    if len(all_accounts) >= 2:
        print("Creating transaction requests...")
        print("-" * 40)
        transaction_requests = create_transaction_requests(
            client, all_accounts, config.CURRENCY
        )
        print(f"Created {len(transaction_requests)} transaction requests")
        print()

    print("=" * 60)
    print("Sandbox population complete!")
    print("=" * 60)


if __name__ == "__main__":
    # Check if token is provided as command line argument
    token = sys.argv[1] if len(sys.argv) > 1 else None
    populate_sandbox(token)
