const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Storage pour les logs et états
let systemState = {
    containers: 0,
    images: 0,
    networks: 0,
    testsPassed: 0,
    logs: {
        orchestration: [],
        deployment: [],
        security: [],
        performance: [],
        network: [],
        storage: []
    }
};

// Utilitaire pour ajouter des logs
function addSystemLog(category, message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        message,
        type,
        id: Date.now()
    };
    
    if (!systemState.logs[category]) {
        systemState.logs[category] = [];
    }
    
    systemState.logs[category].push(logEntry);
    
    // Garder seulement les 50 derniers logs par catégorie
    if (systemState.logs[category].length > 50) {
        systemState.logs[category] = systemState.logs[category].slice(-50);
    }
    
    console.log(`[${category.toUpperCase()}] ${message}`);
}

// Simulation des commandes Docker
function simulateDockerCommand(command) {
    return new Promise((resolve) => {
        const duration = Math.random() * 2000 + 500; // 0.5-2.5 secondes
        setTimeout(() => {
            resolve({
                success: true,
                output: `Simulated: ${command}`,
                duration: duration
            });
        }, duration);
    });
}

// Routes API

// Status du système
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        system: systemState,
        environment: {
            node_version: process.version,
            platform: process.platform,
            memory_usage: process.memoryUsage()
        }
    });
});

// Test d'orchestration
app.post('/api/test/orchestration', async (req, res) => {
    try {
        addSystemLog('orchestration', 'Starting multi-container orchestration test...', 'info');
        
        // Simulation de création d'images
        await simulateDockerCommand('docker build -t web-app .');
        systemState.images++;
        addSystemLog('orchestration', 'Web application image built successfully', 'success');
        
        await simulateDockerCommand('docker build -t db-service .');
        systemState.images++;
        addSystemLog('orchestration', 'Database service image built successfully', 'success');
        
        // Simulation de réseau
        await simulateDockerCommand('docker network create app-network');
        systemState.networks++;
        addSystemLog('orchestration', 'Created overlay network: app-network', 'success');
        
        // Simulation de containers
        await simulateDockerCommand('docker run -d --name postgres --network app-network postgres:14');
        systemState.containers++;
        addSystemLog('orchestration', 'PostgreSQL container started', 'success');
        
        await simulateDockerCommand('docker run -d --name redis --network app-network redis:alpine');
        systemState.containers++;
        addSystemLog('orchestration', 'Redis container started', 'success');
        
        await simulateDockerCommand('docker run -d --name web-1 --network app-network web-app');
        await simulateDockerCommand('docker run -d --name web-2 --network app-network web-app');
        await simulateDockerCommand('docker run -d --name web-3 --network app-network web-app');
        systemState.containers += 3;
        addSystemLog('orchestration', '3 web application containers started', 'success');
        
        await simulateDockerCommand('docker run -d --name nginx-lb --network app-network nginx');
        systemState.containers++;
        addSystemLog('orchestration', 'Nginx load balancer started', 'success');
        
        systemState.testsPassed++;
        addSystemLog('orchestration', 'Multi-container orchestration completed successfully!', 'success');
        
        res.json({
            success: true,
            message: 'Orchestration test completed',
            containers_started: 6,
            networks_created: 1,
            images_built: 2
        });
        
    } catch (error) {
        addSystemLog('orchestration', `Error: ${error.message}`, 'error');
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test Blue-Green deployment
app.post('/api/test/deployment', async (req, res) => {
    try {
        addSystemLog('deployment', 'Starting Blue-Green deployment test...', 'info');
        
        // Simulation du déploiement
        addSystemLog('deployment', 'Current: Blue environment (v1.0) - 100% traffic', 'info');
        
        await simulateDockerCommand('docker build -t app:v1.1 .');
        systemState.images++;
        addSystemLog('deployment', 'New version built: Green environment (v1.1)', 'success');
        
        await simulateDockerCommand('docker run -d --name green-1 app:v1.1');
        await simulateDockerCommand('docker run -d --name green-2 app:v1.1');
        await simulateDockerCommand('docker run -d --name green-3 app:v1.1');
        systemState.containers += 3;
        addSystemLog('deployment', 'Green environment deployed (3 containers)', 'success');
        
        // Simulation des health checks
        await new Promise(resolve => setTimeout(resolve, 1500));
        addSystemLog('deployment', 'Health check: Response time < 200ms ✓', 'success');
        addSystemLog('deployment', 'Health check: All endpoints responding ✓', 'success');
        addSystemLog('deployment', 'Health check: Database connectivity OK ✓', 'success');
        
        // Simulation du switch de trafic
        await new Promise(resolve => setTimeout(resolve, 1000));
        addSystemLog('deployment', 'Switching traffic: Blue → Green', 'info');
        await new Promise(resolve => setTimeout(resolve, 2000));
        addSystemLog('deployment', 'Traffic successfully switched to Green (v1.1)', 'success');
        
        // Cleanup Blue environment
        await simulateDockerCommand('docker stop blue-1 blue-2 blue-3');
        addSystemLog('deployment', 'Blue environment stopped', 'info');
        
        systemState.testsPassed++;
        addSystemLog('deployment', 'Blue-Green deployment completed! Zero downtime achieved.', 'success');
        
        res.json({
            success: true,
            message: 'Blue-Green deployment completed',
            downtime: '0ms',
            new_version: 'v1.1'
        });
        
    } catch (error) {
        addSystemLog('deployment', `Error: ${error.message}`, 'error');
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test de sécurité
app.post('/api/test/security', async (req, res) => {
    try {
        addSystemLog('security', 'Starting security audit...', 'info');
        
        // Simulation des tests de sécurité
        await simulateDockerCommand('docker inspect --format="{{.Config.User}}" container');
        addSystemLog('security', 'Privilege check: All containers running as non-root ✓', 'success');
        
        await simulateDockerCommand('docker scan app:latest');
        addSystemLog('security', 'Vulnerability scan: No critical vulnerabilities found ✓', 'success');
        addSystemLog('security', 'Found 2 medium-risk packages (auto-fixable)', 'info');
        
        await simulateDockerCommand('docker inspect --format="{{.HostConfig.CapDrop}}" container');
        addSystemLog('security', 'Capabilities: NET_ADMIN, SYS_ADMIN dropped ✓', 'success');
        
        await simulateDockerCommand('docker inspect --format="{{.HostConfig.ReadonlyRootfs}}" container');
        addSystemLog('security', 'Filesystem: Root filesystem read-only ✓', 'success');
        
        systemState.testsPassed++;
        addSystemLog('security', 'Security audit completed. Compliance: 98%', 'success');
        
        res.json({
            success: true,
            message: 'Security audit completed',
            compliance_score: '98%',
            vulnerabilities: { critical: 0, high: 0, medium: 2, low: 5 }
        });
        
    } catch (error) {
        addSystemLog('security', `Error: ${error.message}`, 'error');
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test de performance
app.post('/api/test/performance', async (req, res) => {
    try {
        addSystemLog('performance', 'Starting performance benchmarks...', 'info');
        
        // Simulation des tests de performance
        const startupTime = Math.random() * 0.8 + 0.8; // 0.8-1.6s
        await new Promise(resolve => setTimeout(resolve, 1000));
        addSystemLog('performance', `Container startup time: ${startupTime.toFixed(1)}s`, 'success');
        
        const memoryUsage = Math.floor(Math.random() * 20 + 35); // 35-55MB
        await new Promise(resolve => setTimeout(resolve, 800));
        addSystemLog('performance', `Memory usage: ${memoryUsage}MB (optimized)`, 'success');
        
        const diskIO = (Math.random() * 0.5 + 1.0).toFixed(1); // 1.0-1.5GB/s
        await new Promise(resolve => setTimeout(resolve, 1200));
        addSystemLog('performance', `Disk I/O: ${diskIO}GB/s read, ${(diskIO * 0.7).toFixed(1)}GB/s write`, 'success');
        
        const networkThroughput = (Math.random() * 2 + 8).toFixed(1); // 8-10Gbps
        await new Promise(resolve => setTimeout(resolve, 1000));
        addSystemLog('performance', `Network: ${networkThroughput}Gbps (${(networkThroughput/10*100).toFixed(0)}% native)`, 'success');
        
        systemState.testsPassed++;
        addSystemLog('performance', 'Performance benchmark completed. Overall: 96% native speed.', 'success');
        
        res.json({
            success: true,
            message: 'Performance benchmark completed',
            metrics: {
                startup_time: startupTime,
                memory_usage: memoryUsage,
                disk_io: diskIO,
                network_throughput: networkThroughput,
                native_performance: '96%'
            }
        });
        
    } catch (error) {
        addSystemLog('performance', `Error: ${error.message}`, 'error');
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test réseau
app.post('/api/test/network', async (req, res) => {
    try {
        addSystemLog('network', 'Configuring advanced networking...', 'info');
        
        await simulateDockerCommand('docker network create --driver overlay encrypted-network');
        systemState.networks++;
        addSystemLog('network', 'Overlay network with encryption created', 'success');
        
        await simulateDockerCommand('docker service create --network encrypted-network web-service');
        addSystemLog('network', 'Service discovery configured', 'success');
        
        // Simulation des métriques réseau
        const latency = (Math.random() * 0.3 + 0.1).toFixed(1); // 0.1-0.4ms
        const throughput = Math.floor(Math.random() * 10 + 35); // 35-45Gbps
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        addSystemLog('network', `Inter-container latency: ${latency}ms`, 'success');
        addSystemLog('network', `Internal network throughput: ${throughput}Gbps`, 'success');
        
        systemState.testsPassed++;
        addSystemLog('network', 'Advanced networking configured. Service mesh operational.', 'success');
        
        res.json({
            success: true,
            message: 'Network test completed',
            metrics: {
                latency: latency,
                throughput: throughput,
                encryption: 'enabled',
                service_discovery: 'active'
            }
        });
        
    } catch (error) {
        addSystemLog('network', `Error: ${error.message}`, 'error');
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test stockage
app.post('/api/test/storage', async (req, res) => {
    try {
        addSystemLog('storage', 'Configuring persistent storage...', 'info');
        
        await simulateDockerCommand('docker volume create db-data');
        await simulateDockerCommand('docker volume create app-logs');
        addSystemLog('storage', 'Persistent volumes created: db-data, app-logs', 'success');
        
        // Test de persistance
        await new Promise(resolve => setTimeout(resolve, 1500));
        addSystemLog('storage', 'Data persistence test: Container restart → data intact ✓', 'success');
        addSystemLog('storage', 'Data persistence test: Host reboot → data intact ✓', 'success');
        
        // Configuration backup
        await simulateDockerCommand('setup-backup-schedule');
        addSystemLog('storage', 'Automated backup configured: Every 6 hours', 'success');
        addSystemLog('storage', 'Backup retention policy: 30 days', 'info');
        
        systemState.testsPassed++;
        addSystemLog('storage', 'Storage configured. Data protection and replication active.', 'success');
        
        res.json({
            success: true,
            message: 'Storage test completed',
            volumes: ['db-data', 'app-logs'],
            backup: {
                frequency: '6 hours',
                retention: '30 days',
                encryption: 'AES-256'
            }
        });
        
    } catch (error) {
        addSystemLog('storage', `Error: ${error.message}`, 'error');
        res.status(500).json({ success: false, error: error.message });
    }
});

// Récupérer les logs
app.get('/api/logs/:category', (req, res) => {
    const { category } = req.params;
    if (systemState.logs[category]) {
        res.json(systemState.logs[category]);
    } else {
        res.status(404).json({ error: 'Category not found' });
    }
});

// Reset du système
app.post('/api/reset', (req, res) => {
    systemState = {
        containers: 3, // Services de base
        images: 2,     // Images de base
        networks: 1,   // Bridge par défaut
        testsPassed: 0,
        logs: {
            orchestration: [],
            deployment: [],
            security: [],
            performance: [],
            network: [],
            storage: []
        }
    };
    
    addSystemLog('orchestration', 'System reset completed', 'info');
    res.json({ success: true, message: 'System reset' });
});

// Health check pour Render
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Route par défaut pour servir l'HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Docker Demo Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Initialisation du système
    addSystemLog('orchestration', 'Docker Demo Server started', 'success');
    addSystemLog('orchestration', 'System ready for testing', 'info');
});

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;