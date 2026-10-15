class OfflineQueue {
    constructor() {
        this.queue = [];
    }

    add(packet) {
        const exists = this.queue.find(
            p => p.packetId === packet.packetId
        );

        if (exists) {
            throw new Error("Packet already exists.");
        }

        packet.status = "QUEUED";

        this.queue.push(packet);

        return packet;
    }

    remove(packetId) {

        this.queue = this.queue.filter(
            packet => packet.packetId !== packetId
        );
    }

    get(packetId) {

        return this.queue.find(
            packet => packet.packetId === packetId
        );
    }

    getAll() {

        return this.queue;
    }
    updateStatus(packetId, status) {

        const packet = this.get(packetId);

        if (!packet) {
            return null;
        }
        packet.status = status;

        return packet;
    }
    clear() {
        this.queue = [];
    }
}

module.exports = new OfflineQueue();