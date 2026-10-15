
const createPacket = require("../utils/createPacket");
const signPacket = require("../services/signPacket");
const { verifyPacket } = require("../services/verifyPacket");

const SECRET = "test-packet-secret";

let passedTests = 0;
let failedTests = 0;

// Custom test runner
function runTest(name, testFunction) {
    try {
        testFunction();

        passedTests++;
        console.log(` PASS: ${name}`);
    } catch (error) {
        failedTests++;

        console.error(` FAIL: ${name}`);
        console.error("   ", error.stack || error.message || error);
    }
}

// Assertion helper
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

/*
 * 1. Valid packet
 */
runTest("Valid signed packet should verify", () => {
    const packet = createPacket({
        sender: "sender123",
        receiver: "receiver456",
        amount: 500,
        txnId: "txn-test-001"
    });

    const signedPacket = signPacket(packet, SECRET);

    const result = verifyPacket(signedPacket, SECRET);

    assert(
        result.valid === true,
        `Expected valid=true, got ${JSON.stringify(result)}`
    );
});

/*
 * 2. Wrong secret
 */
runTest("Wrong secret should fail verification", () => {
    const packet = createPacket({
        sender: "sender123",
        receiver: "receiver456",
        amount: 500,
        txnId: "txn-test-002"
    });

    const signedPacket = signPacket(packet, SECRET);

    const result = verifyPacket(signedPacket, "wrong-secret");

    assert(
        result.valid === false,
        "Packet verified with wrong secret"
    );
});

/*
 * 3. Tampered amount
 */
runTest("Tampered amount should fail verification", () => {
    const packet = createPacket({
        sender: "sender123",
        receiver: "receiver456",
        amount: 500,
        txnId: "txn-test-003"
    });

    const signedPacket = signPacket(packet, SECRET);

    signedPacket.amount = 5000;

    const result = verifyPacket(signedPacket, SECRET);

    assert(
        result.valid === false,
        "Tampered amount was accepted"
    );
});

/*
 * 4. Tampered receiver
 */
runTest("Tampered receiver should fail verification", () => {
    const packet = createPacket({
        sender: "sender123",
        receiver: "receiver456",
        amount: 500,
        txnId: "txn-test-004"
    });

    const signedPacket = signPacket(packet, SECRET);

    signedPacket.receiver = "attacker999";

    const result = verifyPacket(signedPacket, SECRET);

    assert(
        result.valid === false,
        "Tampered receiver was accepted"
    );
});

/*
 * 5. Tampered sender
 */
runTest("Tampered sender should fail verification", () => {
    const packet = createPacket({
        sender: "sender123",
        receiver: "receiver456",
        amount: 500,
        txnId: "txn-test-005"
    });

    const signedPacket = signPacket(packet, SECRET);

    signedPacket.sender = "attacker999";

    const result = verifyPacket(signedPacket, SECRET);

    assert(
        result.valid === false,
        "Tampered sender was accepted"
    );
});

/*
 * 6. Tampered nonce
 */
runTest("Tampered nonce should fail verification", () => {
    const packet = createPacket({
        sender: "sender123",
        receiver: "receiver456",
        amount: 500,
        txnId: "txn-test-006"
    });

    const signedPacket = signPacket(packet, SECRET);

    signedPacket.nonce = "fake-nonce";

    const result = verifyPacket(signedPacket, SECRET);

    assert(
        result.valid === false,
        "Tampered nonce was accepted"
    );
});

/*
 * 7. Tampered transaction ID
 */
runTest("Tampered txnId should fail verification", () => {
    const packet = createPacket({
        sender: "sender123",
        receiver: "receiver456",
        amount: 500,
        txnId: "txn-test-007"
    });

    const signedPacket = signPacket(packet, SECRET);

    signedPacket.txnId = "fake-txn-id";

    const result = verifyPacket(signedPacket, SECRET);

    assert(
        result.valid === false,
        "Tampered txnId was accepted"
    );
});

/*
 * 8. Tampered packet ID
 */
runTest("Tampered packetId should fail verification", () => {
    const packet = createPacket({
        sender: "sender123",
        receiver: "receiver456",
        amount: 500,
        txnId: "txn-test-008"
    });

    const signedPacket = signPacket(packet, SECRET);

    signedPacket.packetId = "fake-packet-id";

    const result = verifyPacket(signedPacket, SECRET);

    assert(
        result.valid === false,
        "Tampered packetId was accepted"
    );
});

/*
 * 9. Invalid signature
 */
runTest("Invalid signature should fail", () => {
    const packet = createPacket({
        sender: "sender123",
        receiver: "receiver456",
        amount: 500,
        txnId: "txn-test-009"
    });

    const signedPacket = signPacket(packet, SECRET);

    signedPacket.signature =
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    const result = verifyPacket(signedPacket, SECRET);

    assert(
        result.valid === false,
        "Invalid signature was accepted"
    );
});

/*
 * 10. Missing signature
 */
runTest("Missing signature should fail", () => {
    const packet = createPacket({
        sender: "sender123",
        receiver: "receiver456",
        amount: 500,
        txnId: "txn-test-010"
    });

    const signedPacket = signPacket(packet, SECRET);

    delete signedPacket.signature;

    const result = verifyPacket(signedPacket, SECRET);

    assert(
        result.valid === false,
        "Packet without signature was accepted"
    );
});

/*
 * 11. Invalid amount
 */
runTest("Invalid amount should fail", () => {
    const packet = createPacket({
        sender: "sender123",
        receiver: "receiver456",
        amount: 500,
        txnId: "txn-test-011"
    });

    const signedPacket = signPacket(packet, SECRET);

    signedPacket.amount = -100;

    const result = verifyPacket(signedPacket, SECRET);

    assert(
        result.valid === false,
        "Negative amount was accepted"
    );
});

/*
 * 12. Zero amount
 */
runTest("Zero amount should fail", () => {
    const packet = createPacket({
        sender: "sender123",
        receiver: "receiver456",
        amount: 500,
        txnId: "txn-test-012"
    });

    const signedPacket = signPacket(packet, SECRET);

    signedPacket.amount = 0;

    const result = verifyPacket(signedPacket, SECRET);

    assert(
        result.valid === false,
        "Zero amount was accepted"
    );
});

/*
 * 13. Expired packet
 */
runTest("Expired packet should fail", () => {
    const packet = createPacket({
        sender: "sender123",
        receiver: "receiver456",
        amount: 500,
        txnId: "txn-test-013"
    });

    packet.timestamp = Date.now() - (6 * 60 * 1000);

    packet.expiresAt =
        packet.timestamp + (5 * 60 * 1000);

    const signedPacket = signPacket(packet, SECRET);

    const result = verifyPacket(signedPacket, SECRET);

    assert(
        result.valid === false,
        "Expired packet was accepted"
    );
});

/*
 * 14. Future packet
 */
runTest("Packet with future timestamp should fail", () => {
    const packet = createPacket({
        sender: "sender123",
        receiver: "receiver456",
        amount: 500,
        txnId: "txn-test-014"
    });

    packet.timestamp = Date.now() + (2 * 60 * 1000);

    packet.expiresAt =
        packet.timestamp + (5 * 60 * 1000);

    const signedPacket = signPacket(packet, SECRET);

    const result = verifyPacket(signedPacket, SECRET);

    assert(
        result.valid === false,
        "Future packet was accepted"
    );
});

/*
 * 15. Invalid expiry
 */
runTest("Expiry before timestamp should fail", () => {
    const packet = createPacket({
        sender: "sender123",
        receiver: "receiver456",
        amount: 500,
        txnId: "txn-test-015"
    });

    packet.expiresAt = packet.timestamp - 1000;

    const signedPacket = signPacket(packet, SECRET);

    const result = verifyPacket(signedPacket, SECRET);

    assert(
        result.valid === false,
        "Invalid expiry was accepted"
    );
});

/*
 * Final test summary
 */
console.log("\n========== TEST SUMMARY ==========");
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log("==================================");

if (failedTests > 0) {
    process.exitCode = 1;
}

