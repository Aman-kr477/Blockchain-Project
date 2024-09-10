
const redis = require('redis');

const CHANNELS = {
    TEST: "TEST",
    BLOCKCHAIN: "BLOCKCHAIN",
};

class PubSub {
    constructor({ blockchain }) {
        this.blockchain = blockchain;
        this.publisher = redis.createClient();
        this.subscriber = redis.createClient();

        // Connect clients and subscribe to channels
        this.connectClients();
    }

    async connectClients() {
        try {
            // Connect publisher and subscriber
            await this.publisher.connect();
            await this.subscriber.connect();

            // Subscribe to the channels and provide message handlers directly
            await this.subscriber.subscribe(CHANNELS.TEST, (message, channel) => {
                this.handleMessage(channel, message);
            });

            await this.subscriber.subscribe(CHANNELS.BLOCKCHAIN, (message, channel) => {
                this.handleMessage(channel, message);
            });

            console.log("Connected to Redis and subscribed to channels.");
        } catch (error) {
            console.error("Redis connection error:", error);
        }
    }

    handleMessage(channel, message) {
        console.log(`Message received. Channel: ${channel} Message: ${message}`);
        const parsedMessage = JSON.parse(message);

        if (channel === CHANNELS.BLOCKCHAIN) {
            this.blockchain.replaceChain(parsedMessage);
        }
    }

    publish({ channel, message }) {
        // Ensure the publisher is connected before publishing
        if (!this.publisher.isOpen) {
            console.error("Publisher client is not connected.");
            return;
        }

        this.publisher.publish(channel, message).catch((err) => {
            console.error("Failed to publish message:", err);
        });
    }

    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain),
        });
    }
}

module.exports = PubSub;
