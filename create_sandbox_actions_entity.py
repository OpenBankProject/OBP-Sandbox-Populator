#!/usr/bin/env python3
"""
Create a personal system dynamic entity called 'sandbox_actions'

This script creates a dynamic entity definition that can be used to track
sandbox actions performed by users.
"""
import sys
from obp_client import OBPClient
import config


def create_sandbox_actions_entity(client: OBPClient) -> dict:
    """
    Create the sandbox_actions dynamic entity

    Returns:
        The created dynamic entity definition
    """
    payload = {
        "entity_name": "sandbox_actions",
        "has_personal_entity": True,
        "schema": {
            "description": "Tracks sandbox actions performed by users",
            "required": ["action", "timestamp"],
            "properties": {
                "action": {
                    "type": "string",
                    "example": "created_bank"
                },
                "timestamp": {
                    "type": "string",
                    "example": "2024-01-15T10:30:00Z"
                },
                "details": {
                    "type": "string",
                    "example": "Created bank with 5 accounts"
                }
            }
        }
    }

    response = client.session.post(
        f"{client.base_url}/obp/{client.api_version}/management/system-dynamic-entities",
        json=payload
    )

    if response.status_code >= 400:
        raise Exception(f"API Error {response.status_code}: {response.text}")

    return response.json()


def main():
    print("=" * 60)
    print("Create Sandbox Actions Dynamic Entity")
    print("=" * 60)
    print(f"Target: {config.OBP_BASE_URL}")
    print()

    # Initialize client
    client = OBPClient()

    # Get current user info
    print("Getting current user info...")
    try:
        user = client.get_current_user()
        print(f"Authenticated as: {user.get('username')}")
    except Exception as e:
        print(f"Error: Could not get current user. Is authentication configured?")
        print(f"Details: {e}")
        sys.exit(1)

    print()

    # Create the dynamic entity
    print("Creating sandbox_actions dynamic entity...")
    print("-" * 40)

    try:
        entity = create_sandbox_actions_entity(client)
        print("Successfully created dynamic entity:")
        print(f"  Entity Name: {entity.get('entity_name')}")
        print(f"  Dynamic Entity ID: {entity.get('dynamic_entity_id')}")
        print(f"  Has Personal Entity: {entity.get('has_personal_entity')}")
        print(f"  User ID: {entity.get('user_id')}")
    except Exception as e:
        print(f"Error creating dynamic entity: {e}")
        sys.exit(1)

    print()
    print("=" * 60)
    print("Done!")
    print("=" * 60)


if __name__ == "__main__":
    main()
