/**
 * Graph Data Structure and Algorithms for FlashMart
 *
 * Provides graph implementations for:
 * - Referral network analysis and tracking
 * - User relationship mapping and influence analysis
 * - Product recommendation networks
 * - Social network features and community detection
 */

// Node class for graph vertices
class GraphNode {
    constructor(id, data = {}) {
        this.id = id;
        this.data = data;
        this.neighbors = new Map(); // adjacency list: neighborId -> edge weight/relationship
        this.visited = false;
        this.distance = Infinity;
        this.parent = null;
        this.metadata = {}; // For algorithm-specific data
    }

    // Add a neighbor with optional weight/relationship data
    addNeighbor(neighborId, weight = 1, relationship = {}) {
        this.neighbors.set(neighborId, {
            weight,
            relationship,
            timestamp: Date.now()
        });
    }

    // Remove a neighbor
    removeNeighbor(neighborId) {
        return this.neighbors.delete(neighborId);
    }

    // Get neighbor information
    getNeighbor(neighborId) {
        return this.neighbors.get(neighborId);
    }

    // Get all neighbors
    getAllNeighbors() {
        return Array.from(this.neighbors.keys());
    }

    // Get neighbor count (degree)
    getDegree() {
        return this.neighbors.size;
    }

    // Reset node state for new traversal
    reset() {
        this.visited = false;
        this.distance = Infinity;
        this.parent = null;
        this.metadata = {};
    }
}

// Edge class for explicit edge representation
class GraphEdge {
    constructor(from, to, weight = 1, relationship = {}) {
        this.from = from;
        this.to = to;
        this.weight = weight;
        this.relationship = relationship;
        this.timestamp = Date.now();
        this.active = true;
    }

    // Deactivate edge (soft delete)
    deactivate() {
        this.active = false;
    }

    // Check if edge is active
    isActive() {
        return this.active;
    }
}

// Main Graph class
class Graph {
    constructor(directed = false) {
        this.nodes = new Map(); // nodeId -> GraphNode
        this.edges = new Map(); // edgeId -> GraphEdge
        this.directed = directed;
        this.nextEdgeId = 0;
    }

    // Add a node to the graph
    addNode(id, data = {}) {
        if (this.nodes.has(id)) {
            throw new Error(`Node with id ${id} already exists`);
        }

        const node = new GraphNode(id, data);
        this.nodes.set(id, node);
        return node;
    }

    // Remove a node and all its edges
    removeNode(id) {
        const node = this.nodes.get(id);
        if (!node) return false;

        // Remove all edges connected to this node
        node.neighbors.forEach((_, neighborId) => {
            this.removeEdge(id, neighborId);
        });

        if (!this.directed) {
            // In undirected graphs, also remove edges from neighbors
            this.nodes.forEach(otherNode => {
                if (otherNode.neighbors.has(id)) {
                    otherNode.removeNeighbor(id);
                }
            });
        }

        this.nodes.delete(id);
        return true;
    }

    // Get a node by id
    getNode(id) {
        return this.nodes.get(id);
    }

    // Check if node exists
    hasNode(id) {
        return this.nodes.has(id);
    }

    // Add an edge between two nodes
    addEdge(fromId, toId, weight = 1, relationship = {}) {
        if (!this.hasNode(fromId) || !this.hasNode(toId)) {
            throw new Error('Both nodes must exist before adding an edge');
        }

        const fromNode = this.nodes.get(fromId);
        const toNode = this.nodes.get(toId);

        // Add to adjacency list
        fromNode.addNeighbor(toId, weight, relationship);

        if (!this.directed) {
            toNode.addNeighbor(fromId, weight, relationship);
        }

        // Create edge object for tracking
        const edgeId = `${fromId}_${toId}_${this.nextEdgeId++}`;
        const edge = new GraphEdge(fromId, toId, weight, relationship);
        this.edges.set(edgeId, edge);

        return edgeId;
    }

    // Remove an edge
    removeEdge(fromId, toId) {
        if (!this.hasNode(fromId) || !this.hasNode(toId)) {
            return false;
        }

        const fromNode = this.nodes.get(fromId);
        const removed = fromNode.removeNeighbor(toId);

        if (!this.directed) {
            const toNode = this.nodes.get(toId);
            toNode.removeNeighbor(fromId);
        }

        // Remove from edges map (find and remove)
        for (const [edgeId, edge] of this.edges) {
            if ((edge.from === fromId && edge.to === toId) ||
                (!this.directed && edge.from === toId && edge.to === fromId)) {
                edge.deactivate();
                break;
            }
        }

        return removed;
    }

    // Get edge information
    getEdge(fromId, toId) {
        const fromNode = this.nodes.get(fromId);
        return fromNode ? fromNode.getNeighbor(toId) : null;
    }

    // Get all nodes
    getAllNodes() {
        return Array.from(this.nodes.values());
    }

    // Get all edges
    getAllEdges() {
        return Array.from(this.edges.values()).filter(edge => edge.active);
    }

    // Get node count
    getNodeCount() {
        return this.nodes.size;
    }

    // Get edge count
    getEdgeCount() {
        return this.edges.size;
    }

    // Reset all nodes for new traversal
    resetNodes() {
        this.nodes.forEach(node => node.reset());
    }

    // Breadth-First Search
    bfs(startId, targetId = null) {
        this.resetNodes();

        const startNode = this.nodes.get(startId);
        if (!startNode) {
            throw new Error(`Start node ${startId} not found`);
        }

        const queue = [startNode];
        startNode.visited = true;
        startNode.distance = 0;

        const path = [];
        const visitedNodes = [];

        while (queue.length > 0) {
            const currentNode = queue.shift();
            visitedNodes.push(currentNode.id);

            if (targetId && currentNode.id === targetId) {
                // Reconstruct path
                let node = currentNode;
                while (node) {
                    path.unshift(node.id);
                    node = node.parent ? this.nodes.get(node.parent) : null;
                }
                return { path, visitedNodes, found: true };
            }

            // Visit neighbors
            currentNode.neighbors.forEach((edgeData, neighborId) => {
                const neighborNode = this.nodes.get(neighborId);
                if (!neighborNode.visited) {
                    neighborNode.visited = true;
                    neighborNode.distance = currentNode.distance + 1;
                    neighborNode.parent = currentNode.id;
                    queue.push(neighborNode);
                }
            });
        }

        return { path: targetId ? [] : path, visitedNodes, found: targetId ? false : true };
    }

    // Depth-First Search
    dfs(startId, targetId = null) {
        this.resetNodes();

        const startNode = this.nodes.get(startId);
        if (!startNode) {
            throw new Error(`Start node ${startId} not found`);
        }

        const path = [];
        const visitedNodes = [];

        const dfsRecursive = (node, target) => {
            node.visited = true;
            visitedNodes.push(node.id);
            path.push(node.id);

            if (target && node.id === target) {
                return true;
            }

            for (const neighborId of node.neighbors.keys()) {
                const neighborNode = this.nodes.get(neighborId);
                if (!neighborNode.visited) {
                    neighborNode.parent = node.id;
                    if (dfsRecursive(neighborNode, target)) {
                        return true;
                    }
                }
            }

            path.pop();
            return false;
        };

        const found = dfsRecursive(startNode, targetId);

        return {
            path: found ? path : [],
            visitedNodes,
            found
        };
    }

    // Find shortest path using BFS
    shortestPath(startId, targetId) {
        const result = this.bfs(startId, targetId);
        return {
            path: result.path,
            distance: result.path.length > 0 ? result.path.length - 1 : -1,
            found: result.found
        };
    }

    // Detect cycles in the graph
    detectCycle() {
        this.resetNodes();

        const hasCycleRecursive = (nodeId, parentId) => {
            const node = this.nodes.get(nodeId);
            node.visited = true;

            for (const neighborId of node.neighbors.keys()) {
                const neighborNode = this.nodes.get(neighborId);

                if (!neighborNode.visited) {
                    if (hasCycleRecursive(neighborId, nodeId)) {
                        return true;
                    }
                } else if (neighborId !== parentId) {
                    return true; // Back edge found
                }
            }

            return false;
        };

        for (const nodeId of this.nodes.keys()) {
            const node = this.nodes.get(nodeId);
            if (!node.visited) {
                if (hasCycleRecursive(nodeId, null)) {
                    return true;
                }
            }
        }

        return false;
    }

    // Calculate node centrality measures
    calculateCentrality() {
        const centrality = {};

        // Degree centrality
        this.nodes.forEach((node, id) => {
            centrality[id] = {
                degree: node.getDegree(),
                degreeCentrality: node.getDegree() / (this.nodes.size - 1)
            };
        });

        // Closeness centrality (using BFS for shortest paths)
        this.nodes.forEach((node, id) => {
            const distances = [];
            const result = this.bfs(id);

            result.visitedNodes.forEach(visitedId => {
                if (visitedId !== id) {
                    const visitedNode = this.nodes.get(visitedId);
                    distances.push(visitedNode.distance);
                }
            });

            const avgDistance = distances.length > 0 ?
                distances.reduce((a, b) => a + b, 0) / distances.length : 0;

            centrality[id].closenessCentrality = avgDistance > 0 ? 1 / avgDistance : 0;
        });

        return centrality;
    }

    // Find connected components
    findConnectedComponents() {
        this.resetNodes();

        const components = [];
        let componentId = 0;

        const dfsComponent = (nodeId) => {
            const node = this.nodes.get(nodeId);
            node.visited = true;
            node.metadata.componentId = componentId;

            const component = [nodeId];

            for (const neighborId of node.neighbors.keys()) {
                const neighborNode = this.nodes.get(neighborId);
                if (!neighborNode.visited) {
                    component.push(...dfsComponent(neighborId));
                }
            }

            return component;
        };

        for (const nodeId of this.nodes.keys()) {
            const node = this.nodes.get(nodeId);
            if (!node.visited) {
                const component = dfsComponent(nodeId);
                components.push({
                    id: componentId++,
                    nodes: component,
                    size: component.length
                });
            }
        }

        return components;
    }

    // Export graph to JSON
    exportToJSON() {
        const nodes = {};
        const edges = [];

        this.nodes.forEach((node, id) => {
            nodes[id] = {
                data: node.data,
                neighbors: Array.from(node.neighbors.entries()).map(([neighborId, edgeData]) => ({
                    id: neighborId,
                    weight: edgeData.weight,
                    relationship: edgeData.relationship
                }))
            };
        });

        this.edges.forEach((edge, id) => {
            if (edge.active) {
                edges.push({
                    id,
                    from: edge.from,
                    to: edge.to,
                    weight: edge.weight,
                    relationship: edge.relationship
                });
            }
        });

        return {
            directed: this.directed,
            nodes,
            edges,
            nodeCount: this.nodes.size,
            edgeCount: edges.length,
            exportedAt: Date.now()
        };
    }

    // Import graph from JSON
    importFromJSON(data) {
        this.nodes.clear();
        this.edges.clear();

        // Add nodes
        for (const [id, nodeData] of Object.entries(data.nodes)) {
            this.addNode(id, nodeData.data);
        }

        // Add edges
        for (const edgeData of data.edges) {
            try {
                this.addEdge(edgeData.from, edgeData.to, edgeData.weight, edgeData.relationship);
            } catch (error) {
                console.warn(`Failed to add edge ${edgeData.from} -> ${edgeData.to}:`, error);
            }
        }

        return true;
    }
}

// Referral Network Manager - specialized graph for user referrals
class ReferralNetworkManager {
    constructor() {
        this.graph = new Graph(true); // Directed graph for referral relationships
        this.referralCodes = new Map(); // code -> referrer info
        this.userReferrals = new Map(); // userId -> referrals made
        this.referralStats = new Map(); // userId -> stats
    }

    // Add a user to the referral network
    addUser(userId, userData = {}) {
        this.graph.addNode(userId, { ...userData, joinedAt: Date.now() });

        // Initialize referral tracking
        this.userReferrals.set(userId, []);
        this.referralStats.set(userId, {
            totalReferrals: 0,
            successfulReferrals: 0,
            totalEarnings: 0,
            networkDepth: 0,
            influenceScore: 0
        });

        return true;
    }

    // Create a referral relationship
    createReferral(referrerId, referredUserId, referralCode = null) {
        if (!this.graph.hasNode(referrerId) || !this.graph.hasNode(referredUserId)) {
            throw new Error('Both users must exist in the network');
        }

        // Add the referral edge
        const edgeId = this.graph.addEdge(referrerId, referredUserId, 1, {
            type: 'referral',
            code: referralCode,
            createdAt: Date.now()
        });

        // Track referral
        const referrals = this.userReferrals.get(referrerId) || [];
        referrals.push({
            referredUserId,
            referralCode,
            timestamp: Date.now(),
            status: 'pending'
        });
        this.userReferrals.set(referrerId, referrals);

        // Update stats
        const stats = this.referralStats.get(referrerId);
        stats.totalReferrals++;

        return edgeId;
    }

    // Mark referral as successful (e.g., when referred user makes a purchase)
    markReferralSuccessful(referrerId, referredUserId, earnings = 0) {
        const referrals = this.userReferrals.get(referrerId) || [];
        const referral = referrals.find(r => r.referredUserId === referredUserId);

        if (referral) {
            referral.status = 'successful';
            referral.earnings = earnings;
            referral.completedAt = Date.now();
        }

        // Update stats
        const stats = this.referralStats.get(referrerId);
        stats.successfulReferrals++;
        stats.totalEarnings += earnings;

        return true;
    }

    // Generate unique referral code for a user
    generateReferralCode(userId) {
        const code = `REF_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        this.referralCodes.set(code, {
            userId,
            createdAt: Date.now(),
            uses: 0
        });

        return code;
    }

    // Get referral statistics for a user
    getUserReferralStats(userId) {
        const stats = this.referralStats.get(userId) || {};
        const referrals = this.userReferrals.get(userId) || [];

        return {
            ...stats,
            recentReferrals: referrals.slice(0, 10),
            totalReferrals: referrals.length,
            pendingReferrals: referrals.filter(r => r.status === 'pending').length
        };
    }

    // Find referral chain/path from root referrer
    findReferralChain(userId) {
        const result = this.graph.dfs(null, userId); // Find path to userId

        if (result.found) {
            return {
                chain: result.path,
                depth: result.path.length - 1,
                found: true
            };
        }

        return { chain: [], depth: -1, found: false };
    }

    // Calculate network influence score for a user
    calculateInfluenceScore(userId) {
        const stats = this.referralStats.get(userId);
        if (!stats) return 0;

        // BFS to find all reachable users (network size)
        const result = this.graph.bfs(userId);
        const networkSize = result.visitedNodes.length;

        // Calculate influence based on network size, depth, and success rate
        const successRate = stats.totalReferrals > 0 ? stats.successfulReferrals / stats.totalReferrals : 0;

        return (networkSize * 0.4) + (stats.networkDepth * 0.3) + (successRate * 100 * 0.3);
    }

    // Find top influencers in the network
    getTopInfluencers(limit = 10) {
        const influencers = [];

        this.graph.nodes.forEach((node, userId) => {
            const stats = this.referralStats.get(userId);
            if (stats) {
                const influenceScore = this.calculateInfluenceScore(userId);
                influencers.push({
                    userId,
                    ...stats,
                    influenceScore,
                    networkSize: this.getUserNetworkSize(userId)
                });
            }
        });

        return influencers
            .sort((a, b) => b.influenceScore - a.influenceScore)
            .slice(0, limit);
    }

    // Get the size of a user's referral network
    getUserNetworkSize(userId) {
        const result = this.graph.bfs(userId);
        return result.visitedNodes.length - 1; // Exclude the user themselves
    }

    // Find mutual connections or referral loops
    findReferralLoops() {
        return this.graph.detectCycle();
    }

    // Get referral network analytics
    getNetworkAnalytics() {
        const totalUsers = this.graph.getNodeCount();
        const totalReferrals = this.graph.getEdgeCount();
        const components = this.graph.findConnectedComponents();

        const stats = {
            totalUsers,
            totalReferrals,
            averageReferralsPerUser: totalUsers > 0 ? totalReferrals / totalUsers : 0,
            connectedComponents: components.length,
            largestComponent: components.reduce((max, comp) => comp.size > max.size ? comp : max, { size: 0 }),
            networkDensity: totalUsers > 1 ? (totalReferrals * 2) / (totalUsers * (totalUsers - 1)) : 0,
            topInfluencers: this.getTopInfluencers(5),
            averageInfluenceScore: this.getAverageInfluenceScore()
        };

        return stats;
    }

    getAverageInfluenceScore() {
        let totalScore = 0;
        let count = 0;

        this.referralStats.forEach(stats => {
            if (stats.totalReferrals > 0) {
                totalScore += this.calculateInfluenceScore(stats.userId);
                count++;
            }
        });

        return count > 0 ? totalScore / count : 0;
    }

    // Update network depth for all users
    updateNetworkDepths() {
        this.referralStats.forEach((stats, userId) => {
            const chain = this.findReferralChain(userId);
            stats.networkDepth = chain.depth;
        });
    }

    // Export referral network data
    exportNetwork() {
        return {
            graph: this.graph.exportToJSON(),
            referralCodes: Object.fromEntries(this.referralCodes),
            userReferrals: Object.fromEntries(this.userReferrals),
            referralStats: Object.fromEntries(this.referralStats),
            exportedAt: Date.now()
        };
    }

    // Import referral network data
    importNetwork(data) {
        if (data.graph) {
            this.graph.importFromJSON(data.graph);
        }

        if (data.referralCodes) {
            this.referralCodes = new Map(Object.entries(data.referralCodes));
        }

        if (data.userReferrals) {
            this.userReferrals = new Map(Object.entries(data.userReferrals));
        }

        if (data.referralStats) {
            this.referralStats = new Map(Object.entries(data.referralStats));
        }

        return true;
    }
}

// Factory function for easy creation
function createGraph(directed = false) {
    return new Graph(directed);
}

function createReferralNetwork() {
    return new ReferralNetworkManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Graph,
        GraphNode,
        GraphEdge,
        ReferralNetworkManager,
        createGraph,
        createReferralNetwork
    };
}

// Global export
window.Graph = Graph;
window.GraphNode = GraphNode;
window.GraphEdge = GraphEdge;
window.ReferralNetworkManager = ReferralNetworkManager;
window.createGraph = createGraph;
window.createReferralNetwork = createReferralNetwork;
