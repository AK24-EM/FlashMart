import activityTracker from './activity-tracker.js';

class ActivityDashboard {
    constructor(containerId = 'activity-dashboard') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Activity Dashboard: Container element not found');
            return;
        }
        
        this.init();
    }
    
    init() {
        this.render();
        this.updateMetrics();
        
        // Update metrics every 5 seconds
        this.updateInterval = setInterval(() => this.updateMetrics(), 5000);
    }
    
    formatTime(ms) {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${Math.floor(ms/1000)}s`;
        if (ms < 3600000) return `${Math.floor(ms/60000)}m`;
        return `${Math.floor(ms/3600000)}h`;
    }
    
    async updateMetrics() {
        try {
            const windows = activityTracker.getAvailableWindowSizes();
            const metrics = await Promise.all(
                windows.map(size => ({
                    size,
                    label: this.formatTime(size),
                    data: activityTracker.getMetrics(size)
                }))
            );
            
            this.render(metrics);
        } catch (error) {
            console.error('Error updating activity metrics:', error);
        }
    }
    
    render(metrics = []) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="activity-dashboard">
                <h3>Real-time Activity</h3>
                <div class="activity-metrics">
                    ${metrics.map(metric => this.renderMetric(metric)).join('')}
                </div>
            </div>
        `;
        
        // Add some basic styling if not already present
        if (!document.getElementById('activity-dashboard-styles')) {
            const style = document.createElement('style');
            style.id = 'activity-dashboard-styles';
            style.textContent = `
                .activity-dashboard {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .activity-metrics {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-top: 1rem;
                }
                .metric-card {
                    background: white;
                    padding: 1rem;
                    border-radius: 6px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .metric-value {
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin: 0.5rem 0;
                }
                .metric-label {
                    font-size: 0.875rem;
                    color: #666;
                }
                .event-breakdown {
                    margin-top: 0.5rem;
                    font-size: 0.875rem;
                }
                .event-item {
                    display: flex;
                    justify-content: space-between;
                    margin: 0.25rem 0;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    renderMetric({ label, data }) {
        if (!data) return '';
        
        const eventItems = Object.entries(data.eventsByType || {})
            .map(([type, count]) => `
                <div class="event-item">
                    <span>${type.replace(/_/g, ' ')}</span>
                    <span>${count}</span>
                </div>
            `).join('');
        
        return `
            <div class="metric-card">
                <div class="metric-label">Last ${label}</div>
                <div class="metric-value">${data.totalEvents}</div>
                <div class="metric-label">${data.eventRate} events/s</div>
                ${eventItems ? `
                    <div class="event-breakdown">
                        ${eventItems}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export a function to initialize the dashboard
export function initActivityDashboard(containerId = 'activity-dashboard') {
    return new ActivityDashboard(containerId);
}
