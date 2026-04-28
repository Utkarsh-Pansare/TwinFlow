const { v4: uuidv4 } = require('uuid');

class DigitalTwinStore {
    constructor() {
        this.orderTwins = new Map();
        this.shipmentTwins = new Map();
        this.supplierTwins = new Map();
        this.financialTwins = new Map();
        this.alerts = [];
    }

    createOrderTwin(data) {
        const id = `ORD-${uuidv4().split('-')[0].toUpperCase()}`;
        const twin = {
            id,
            ...data,
            createdAt: new Date()
        };
        this.orderTwins.set(id, twin);
        return twin;
    }

    createShipmentTwin(orderTwin, routingData) {
        const id = `SHIP-${uuidv4().split('-')[0].toUpperCase()}`;
        const twin = {
            id,
            orderId: orderTwin.id,
            currentLocation: orderTwin.origin,
            destination: orderTwin.destination,
            mode: orderTwin.mode,
            status: 'PLANNED',
            route: routingData.route,
            eta: routingData.eta,
            riskScore: 10,
            resilienceScore: 90,
            lastUpdate: new Date(),
            history: []
        };
        this.shipmentTwins.set(id, twin);
        return twin;
    }

    updateShipment(id, updates) {
        const twin = this.shipmentTwins.get(id);
        if (twin) {
            Object.assign(twin, updates, { lastUpdate: new Date() });
            return twin;
        }
        return null;
    }

    getAllShipments() {
        return Array.from(this.shipmentTwins.values());
    }

    addAlert(alert) {
        this.alerts.push({
            id: uuidv4(),
            timestamp: new Date(),
            ...alert
        });
        if (this.alerts.length > 50) this.alerts.shift();
    }

    getAlerts() {
        return this.alerts;
    }
}

module.exports = new DigitalTwinStore();
