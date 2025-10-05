/**
 * Lead Service for managing leads and customer acquisition
 * Implements a complete Sales Funnel with stages: Prospect → Qualified → Customer → Loyal
 * Uses Firestore for data storage and hashing for duplicate detection
 */

// Lead stages
const LEAD_STAGES = {
    PROSPECT: 'prospect',
    QUALIFIED: 'qualified',
    CUSTOMER: 'customer',
    LOYAL: 'loyal'
};

// Lead statuses
const LEAD_STATUS = {
    NEW: 'new',
    CONTACTED: 'contacted',
    NURTURING: 'nurturing',
    UNQUALIFIED: 'unqualified',
    CONVERTED: 'converted'
};

class LeadService {
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
        this.leadsRef = null;
        this.customersRef = null;
        this.leadStages = LEAD_STAGES;
        this.leadStatuses = LEAD_STATUS;
        this.priorityQueue = new PriorityQueue();
        this.initialized = false;
    }

    /**
     * Initialize the LeadService
     */
    async initialize() {
        if (this.initialized) return;
        
        await this.firebaseService.initialize();
        const db = this.firebaseService.db;
        
        if (!db) {
            console.error('Firestore not initialized');
            return false;
        }
        
        this.leadsRef = db.collection('leads');
        this.customersRef = db.collection('customers');
        this.initialized = true;
        
        // Start processing the queue
        this.processQueue();
        
        return true;
    }

    /**
     * Add a new lead to the system
     * @param {Object} leadData - Lead information
     * @returns {Promise<string>} The ID of the created lead
     */
    /**
     * Generate a hash for duplicate detection
     * @param {string} str - String to hash
     * @returns {string} - Hashed string
     */
    generateHash(str) {
        if (!str) return '';
        return str.toString().split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0).toString();
    }

    /**
     * Check for duplicate leads using email and phone hashing
     * @param {Object} leadData - Lead data to check
     * @returns {Promise<boolean>} - True if duplicate exists
     */
    async checkForDuplicates(leadData) {
        if (!leadData.email && !leadData.phone) return false;
        
        const emailHash = leadData.email ? this.generateHash(leadData.email.toLowerCase()) : null;
        const phoneHash = leadData.phone ? this.generateHash(leadData.phone.replace(/\D/g, '')) : null;
        
        let query = this.leadsRef;
        
        if (emailHash && phoneHash) {
            query = query.where('emailHash', '==', emailHash)
                       .where('phoneHash', '==', phoneHash);
        } else if (emailHash) {
            query = query.where('emailHash', '==', emailHash);
        } else if (phoneHash) {
            query = query.where('phoneHash', '==', phoneHash);
        }
        
        const snapshot = await query.limit(1).get();
        return !snapshot.empty;
    }

    /**
     * Add a new lead with duplicate check and proper stage management
     * @param {Object} leadData - Lead information
     * @returns {Promise<Object>} - The created lead with ID and status
     */
    async addLead(leadData) {
        if (!this.initialized) await this.initialize();
        
        // Check for duplicates
        const isDuplicate = await this.checkForDuplicates(leadData);
        if (isDuplicate) {
            throw new Error('A lead with this email or phone already exists');
        }
        
        const now = new Date().toISOString();
        const lead = {
            ...leadData,
            stage: this.leadStages.PROSPECT,
            status: this.leadStatuses.NEW,
            score: this.calculateLeadScore(leadData),
            emailHash: leadData.email ? this.generateHash(leadData.email.toLowerCase()) : null,
            phoneHash: leadData.phone ? this.generateHash(leadData.phone.replace(/\D/g, '')) : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        try {
            const docRef = await this.leadsRef.add({
                ...lead,
                createdAt: now,
                updatedAt: now,
                history: [{
                    stage: this.leadStages.PROSPECT,
                    status: this.leadStatuses.NEW,
                    timestamp: now,
                    notes: 'Lead created'
                }]
            });
            
            this.priorityQueue.enqueue({ id: docRef.id, ...lead }, lead.score);
            return {
                id: docRef.id,
                ...lead,
                message: 'Lead created successfully'
            };
        } catch (error) {
            console.error('Error adding lead:', error);
            throw error;
        }
    }

    /**
     * Calculate lead score based on lead data
     * @param {Object} lead - Lead data
     * @returns {number} Lead score
     */
    calculateLeadScore(lead) {
        let score = 0;
        
        // Basic information scoring
        if (lead.email) score += 10;
        if (lead.phone) score += 15;
        if (lead.company) score += 5;
        
        // Source scoring
        const sourceScores = {
            'referral': 25,
            'website': 15,
            'social': 10,
            'event': 10,
            'other': 5
        };
        score += sourceScores[lead.source?.toLowerCase()] || 0;
        
        // Interest level scoring
        if (lead.interestLevel === 'high') score += 20;
        else if (lead.interestLevel === 'medium') score += 10;
        
        // Budget scoring
        if (lead.budget > 10000) score += 25;
        else if (lead.budget > 5000) score += 15;
        else if (lead.budget > 1000) score += 5;
        
        return Math.min(score, 100); // Cap score at 100
    }

    /**
     * Update lead stage with history tracking
     * @param {string} leadId - ID of the lead to update
     * @param {string} newStage - New stage to transition to
     * @param {string} status - New status
     * @param {string} notes - Optional notes about the transition
     * @returns {Promise<void>}
     */
    async updateLeadStage(leadId, newStage, status, notes = '') {
        if (!Object.values(this.leadStages).includes(newStage)) {
            throw new Error(`Invalid lead stage: ${newStage}`);
        }
        
        const now = new Date().toISOString();
        const updateData = {
            stage: newStage,
            status: status,
            updatedAt: now,
            [`history`]: this.firebaseService.db.FieldValue.arrayUnion({
                stage: newStage,
                status: status,
                timestamp: now,
                notes: notes
            })
        };
        
        await this.leadsRef.doc(leadId).update(updateData);
        
        // If moving to customer stage, create/update customer record
        if (newStage === this.leadStages.CUSTOMER) {
            await this.convertToCustomer(leadId);
        }
    }

    /**
     * Process the next lead in the queue
     */
    async processNextLead() {
        if (this.priorityQueue.isEmpty()) {
            console.log('No leads in queue');
            return;
        }
        
        const lead = this.priorityQueue.dequeue();
        console.log(`Processing lead: ${lead.id}`);
        
        try {
            // Update lead status to 'contacted'
            await this.updateLeadStage(
                lead.id,
                lead.stage || this.leadStages.PROSPECT,
                this.leadStatuses.CONTACTED,
                'Initial contact made'
            );
            
            // Qualify the lead
            const isQualified = await this.qualifyLead(lead);
            
            if (isQualified) {
                await this.updateLeadStage(
                    lead.id,
                    this.leadStages.QUALIFIED,
                    this.leadStatuses.NURTURING,
                    'Lead qualified for sales process'
                );
            } else {
                await this.updateLeadStage(
                    lead.id,
                    lead.stage || this.leadStages.PROSPECT,
                    this.leadStatuses.UNQUALIFIED,
                    'Lead did not meet qualification criteria'
                );
            }
        } catch (error) {
            console.error(`Error processing lead ${lead.id}:`, error);
            // Re-add to queue if there was an error
            this.priorityQueue.enqueue(lead, lead.score);
        }
    }

    /**
     * Process the queue continuously
     */
    async processQueue() {
        while (!this.priorityQueue.isEmpty()) {
            await this.processNextLead();
        }
        
        // Check again after a delay
        setTimeout(() => this.processQueue(), 60000); // Check every minute
    }

    /**
     * Qualify a lead based on business rules
     * @param {Object} lead - Lead to qualify
     * @returns {Promise<boolean>} Whether the lead is qualified
     */
    async qualifyLead(lead) {
        // Implement your qualification logic here
        // For example, check if the lead meets certain criteria
        
        // Example: Require email and phone for qualification
        if (!lead.email || !lead.phone) {
            return false;
        }
        
        // Example: Minimum score threshold
        if (lead.score < 30) {
            return false;
        }
        
        // Additional qualification checks can be added here
        
        return true;
    }

    /**
     * Convert a qualified lead to a customer
     * @param {string} leadId - ID of the lead to convert
     */
    async convertToCustomer(leadId) {
        try {
            const leadDoc = await this.leadsRef.doc(leadId).get();
            if (!leadDoc.exists) {
                throw new Error('Lead not found');
            }
            
            const lead = { id: leadDoc.id, ...leadDoc.data() };
            const now = new Date().toISOString();
            
            // Create or update customer record
            const customerData = {
                leadId: lead.id,
                email: lead.email,
                name: lead.name,
                phone: lead.phone,
                company: lead.company,
                joinDate: now,
                loyaltyPoints: 100, // Starting points
                tier: 'bronze',
                lastActivity: now,
                source: lead.source || 'website',
                tags: lead.tags || [],
                metadata: {
                    originalLeadScore: lead.score,
                    conversionDate: now,
                    acquisitionCampaign: lead.campaign || 'organic'
                },
                updatedAt: now
            };
            
            // Check if customer already exists
            const existingCustomer = await this.customersRef
                .where('email', '==', lead.email)
                .limit(1)
                .get();
            
            if (!existingCustomer.empty) {
                // Update existing customer
                const customerId = existingCustomer.docs[0].id;
                await this.customersRef.doc(customerId).update(customerData);
                console.log(`Updated existing customer record for lead ${leadId}`);
            } else {
                // Create new customer
                customerData.createdAt = now;
                await this.customersRef.add(customerData);
                console.log(`Created new customer record for lead ${leadId}`);
            }
            
            // Update lead to customer stage
            await this.updateLeadStage(
                leadId,
                this.leadStages.CUSTOMER,
                this.leadStatuses.CONVERTED,
                'Successfully converted to customer'
            );
            
            console.log(`Lead ${leadId} converted to customer`);
        } catch (error) {
            console.error(`Error converting lead ${lead.id} to customer:`, error);
            throw error;
        }
    }

    /**
     * Get all leads with optional filters and pagination
     * @param {Object} options - Query options
     * @param {string} options.stage - Filter by stage (prospect, qualified, customer, loyal)
     * @param {string} options.status - Filter by status
     * @param {number} options.minScore - Minimum lead score
     * @param {string} options.sortBy - Field to sort by (default: createdAt)
     * @param {string} options.sortOrder - Sort order (asc/desc, default: desc)
     * @param {number} options.limit - Maximum number of results (default: 20)
     * @param {string} options.startAfter - Document ID to start after for pagination
     * @returns {Promise<{leads: Array, lastVisible: any}>} List of leads and pagination token
     */
    async getLeads({
        stage,
        status,
        minScore,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        limit = 20,
        startAfter = null
    } = {}) {
        if (!this.initialized) await this.initialize();
        
        let query = this.leadsRef;
        
        // Apply filters
        if (stage) {
            query = query.where('stage', '==', stage);
        }
        
        if (status) {
            query = query.where('status', '==', status);
        }
        
        if (minScore) {
            query = query.where('score', '>=', Number(minScore));
        }
        
        // Apply sorting
        query = query.orderBy(sortBy, sortOrder);
        
        // Apply pagination
        if (startAfter) {
            const lastDoc = await this.leadsRef.doc(startAfter).get();
            query = query.startAfter(lastDoc);
        }
        
        // Apply limit
        query = query.limit(limit);
        
        const snapshot = await query.get();
        const leads = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Add helper methods
            isProspect: doc.data().stage === this.leadStages.PROSPECT,
            isQualified: doc.data().stage === this.leadStages.QUALIFIED,
            isCustomer: doc.data().stage === this.leadStages.CUSTOMER,
            isLoyal: doc.data().stage === this.leadStages.LOYAL
        }));
        
        return {
            leads,
            lastVisible: snapshot.docs[snapshot.docs.length - 1]?.id || null,
            hasMore: snapshot.docs.length >= limit
        };
    }
    
    /**
     * Promote a lead to the next stage in the funnel
     * @param {string} leadId - ID of the lead to promote
     * @param {string} notes - Optional notes about the promotion
     * @returns {Promise<Object>} Updated lead
     */
    async promoteLead(leadId, notes = '') {
        const leadDoc = await this.leadsRef.doc(leadId).get();
        if (!leadDoc.exists) {
            throw new Error('Lead not found');
        }
        
        const lead = leadDoc.data();
        const currentStage = lead.stage;
        let newStage = currentStage;
        let newStatus = lead.status;
        
        // Determine next stage
        switch (currentStage) {
            case this.leadStages.PROSPECT:
                newStage = this.leadStages.QUALIFIED;
                newStatus = this.leadStatuses.NURTURING;
                break;
            case this.leadStages.QUALIFIED:
                newStage = this.leadStages.CUSTOMER;
                newStatus = this.leadStatuses.CONVERTED;
                break;
            case this.leadStages.CUSTOMER:
                newStage = this.leadStages.LOYAL;
                newStatus = 'active';
                break;
            case this.leadStages.LOYAL:
                // Already at highest stage
                break;
        }
        
        if (newStage !== currentStage) {
            await this.updateLeadStage(leadId, newStage, newStatus, notes || `Promoted to ${newStage}`);
            
            // If promoting to customer, handle customer creation
            if (newStage === this.leadStages.CUSTOMER) {
                await this.convertToCustomer(leadId);
            }
            
            // Get updated lead
            const updatedDoc = await this.leadsRef.doc(leadId).get();
            return { id: updatedDoc.id, ...updatedDoc.data() };
        }
        
        return { id: leadId, ...lead };
    }

    /**
     * Get a lead by ID
     * @param {string} leadId - ID of the lead to get
     * @returns {Promise<Object>} Lead data
     */
    async getLead(leadId) {
        if (!this.initialized) await this.initialize();
        
        const doc = await this.leadsRef.doc(leadId).get();
        if (!doc.exists) {
            throw new Error('Lead not found');
        }
        
        return { id: doc.id, ...doc.data() };
    }
}

/**
 * Priority Queue implementation for lead processing
 */
class PriorityQueue {
    constructor() {
        this.items = [];
    }

    /**
     * Add an item to the queue with a priority
     * @param {*} element - The element to add
     * @param {number} priority - Priority of the element (higher is more important)
     */
    enqueue(element, priority) {
        const queueElement = { element, priority };
        let added = false;
        
        // Find the correct position based on priority
        for (let i = 0; i < this.items.length; i++) {
            if (queueElement.priority > this.items[i].priority) {
                this.items.splice(i, 0, queueElement);
                added = true;
                break;
            }
        }
        
        // If element has the lowest priority, add to the end
        if (!added) {
            this.items.push(queueElement);
        }
    }

    /**
     * Remove and return the highest priority element
     * @returns {*} The highest priority element
     */
    dequeue() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items.shift().element;
    }

    /**
     * Check if the queue is empty
     * @returns {boolean} True if the queue is empty
     */
    isEmpty() {
        return this.items.length === 0;
    }

    /**
     * Get the size of the queue
     * @returns {number} Number of elements in the queue
     */
    size() {
        return this.items.length;
    }

    /**
     * Get the next element without removing it
     * @returns {*} The next element in the queue
     */
    peek() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items[0].element;
    }
}

// Export a singleton instance
let leadServiceInstance = null;

export function getLeadService(firebaseService) {
    if (!leadServiceInstance && firebaseService) {
        leadServiceInstance = new LeadService(firebaseService);
    }
    return leadServiceInstance;
}
