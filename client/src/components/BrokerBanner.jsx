import React from 'react';
import CopyButton from './CopyButton';

export default function BrokerBanner({ broker }) {
    return (
        <section className="broker-banner" id="brokerBanner">
            <div className="broker-info-grid">
                <div className="broker-info-item">
                    <span className="broker-label">MQTT Broker IP</span>
                    <div className="broker-value-wrap">
                        <span className="broker-value" id="brokerIP">{broker.ip || '—'}</span>
                        <CopyButton text={broker.ip} />
                    </div>
                </div>
                <div className="broker-info-item">
                    <span className="broker-label">MQTT Port</span>
                    <div className="broker-value-wrap">
                        <span className="broker-value" id="brokerPort">{broker.port || '—'}</span>
                        <CopyButton text={String(broker.port)} />
                    </div>
                </div>
                <div className="broker-info-item">
                    <span className="broker-label">Connected Devices</span>
                    <span className="broker-value accent" id="brokerClients">
                        {broker.connectedClients ?? 0}
                    </span>
                </div>
                <div className="broker-info-item">
                    <span className="broker-label">Status</span>
                    <span className={`broker-value ${broker.running ? 'status-active' : ''}`}>
                        {broker.running ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
        </section>
    );
}
