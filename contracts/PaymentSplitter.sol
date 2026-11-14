// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title PaymentSplitter
/// @notice Splits USDC payments directly from a payer to recipients without taking custody.
/// @dev Deploy with the intended network's USDC token. Amounts use the token's smallest unit.
///      Stores only a split counter and reentrancy protection, not bills or user balances.
///      Unsolicited token transfers cannot be prevented and cannot be recovered here.
contract PaymentSplitter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Maximum number of recipients in a single split.
    uint256 public constant MAX_RECIPIENTS = 50;

    /// @notice Token used for every split, fixed at construction.
    IERC20 public immutable token;

    /// @notice Number of successful splits; the first split has ID 1.
    uint256 public splitCount;

    /// @notice The token address cannot be zero.
    error InvalidToken();
    /// @notice Recipient and amount arrays must have equal lengths.
    error LengthMismatch();
    /// @notice Recipient count must be between 1 and MAX_RECIPIENTS inclusive.
    error InvalidRecipientCount(uint256 count);
    /// @notice A recipient at the given index is zero or this contract.
    error InvalidRecipient(uint256 index, address recipient);
    /// @notice The amount at the given index must be positive.
    error ZeroAmount(uint256 index);
    /// @notice Memo exceeds the maximum of 140 bytes.
    error MemoTooLong(uint256 length);

    /// @notice Records a successful split; reverted transactions retain no events.
    /// @param splitId Sequential identifier starting at 1.
    /// @param payer Account funding the split.
    /// @param total Sum of all amounts in token base units.
    /// @param recipientCount Number of recipient entries, including duplicates.
    /// @param memo User-supplied memo of at most 140 bytes.
    event SplitCreated(
        uint256 indexed splitId,
        address indexed payer,
        uint256 total,
        uint256 recipientCount,
        string memo
    );

    /// @notice Records one direct payer-to-recipient transfer.
    /// @param splitId Identifier of the enclosing split.
    /// @param payer Account funding the transfer.
    /// @param recipient Account receiving the tokens.
    /// @param amount Transfer amount in token base units.
    event SplitPaid(
        uint256 indexed splitId,
        address indexed payer,
        address indexed recipient,
        uint256 amount
    );

    /// @notice Sets the token used for all payments.
    /// @param token_ Intended USDC token contract; must not be the zero address.
    constructor(IERC20 token_) {
        if (address(token_) == address(0)) revert InvalidToken();
        token = token_;
    }

    /// @notice Pays each recipient directly using the caller's token allowance.
    /// @dev Caller must approve this contract for the total beforehand. All validation
    ///      precedes transfers; any failed transfer reverts the entire split atomically.
    ///      Duplicate recipients and payments to the payer are permitted.
    /// @param recipients Between 1 and 50 nonzero addresses, excluding this contract.
    /// @param amounts Positive amounts in token base units, one per recipient.
    /// @param memo Memo limited to 140 bytes, not necessarily 140 characters.
    /// @return splitId Sequential identifier assigned to the successful split.
    function split(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string calldata memo
    ) external nonReentrant returns (uint256 splitId) {
        uint256 count = recipients.length;
        if (count != amounts.length) revert LengthMismatch();
        if (count == 0 || count > MAX_RECIPIENTS) revert InvalidRecipientCount(count);
        uint256 memoLength = bytes(memo).length;
        if (memoLength > 140) revert MemoTooLong(memoLength);

        uint256 total;
        for (uint256 i = 0; i < count; ++i) {
            address recipient = recipients[i];
            if (recipient == address(0) || recipient == address(this)) {
                revert InvalidRecipient(i, recipient);
            }
            if (amounts[i] == 0) revert ZeroAmount(i);
            total += amounts[i];
        }

        splitId = ++splitCount;
        emit SplitCreated(splitId, msg.sender, total, count, memo);

        for (uint256 i = 0; i < count; ++i) {
            token.safeTransferFrom(msg.sender, recipients[i], amounts[i]);
            emit SplitPaid(splitId, msg.sender, recipients[i], amounts[i]);
        }
    }
}
