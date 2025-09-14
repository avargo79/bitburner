import { ReactGamePage } from '/lib/react-game-page';
import { ReactElementFinder } from '/lib/react-element-finder';
import { GameSection, NavigationParams, NavigationResult, ReactComponentInfo } from '/navigator-react-types';

/**
 * React-powered City page navigation
 * Handles city locations, travel, jobs, and activities
 */
export class ReactCityPage extends ReactGamePage {
    private elementFinder: ReactElementFinder;

    constructor() {
        super();
        this.elementFinder = new ReactElementFinder();
    }

    async navigate(params?: NavigationParams): Promise<NavigationResult> {
        try {
            // Look for City navigation tab
            const cityNav = await this.elementFinder.findByCriteria({
                textContent: 'City',
                interactive: true,
                muiType: 'Tab',
                limit: 1
            });

            if (cityNav.length === 0) {
                // Try "World" or location-based navigation
                const worldNav = await this.elementFinder.findByCriteria({
                    customFilter: (component) => {
                        const text = this.extractComponentText(component);
                        return (text.includes('City') || text.includes('World') || text.includes('Location')) &&
                               this.isComponentInteractive(component);
                    },
                    sortBy: 'muiPriority',
                    limit: 1
                });

                if (worldNav.length === 0) {
                    return this.createResult(false, 'City navigation element not found');
                }

                const clickSuccess = await this.clickComponent(worldNav[0]);
                if (!clickSuccess) {
                    return this.createResult(false, 'Failed to click city navigation');
                }
            } else {
                const clickSuccess = await this.clickComponent(cityNav[0]);
                if (!clickSuccess) {
                    return this.createResult(false, 'Failed to click city tab');
                }
            }

            // Wait for city page to load
            const cityReady = await this.waitForPageTransition('City', 3000);
            if (!cityReady) {
                const alternativeReady = await this.waitForComponent('Location', 2000);
                if (!alternativeReady) {
                    return this.createResult(false, 'City page did not load');
                }
            }

            // Handle specific location/city navigation if requested
            if (params?.locationName) {
                const locationSuccess = await this.navigateToLocation(params.locationName, params);
                if (!locationSuccess) {
                    return this.createResult(false, `Failed to navigate to location ${params.locationName}`);
                }
            } else if (params?.cityName) {
                const citySuccess = await this.travelToCity(params.cityName);
                if (!citySuccess) {
                    return this.createResult(false, `Failed to travel to city ${params.cityName}`);
                }
            }

            return this.createResult(true, 'Successfully navigated to City');

        } catch (error) {
            return this.createResult(false, `City navigation error: ${error}`);
        }
    }

    async isOnPage(): Promise<boolean> {
        try {
            // Check for city-specific components
            const cityComponents = await this.elementFinder.findByCriteria({
                displayName: 'City',
                visible: true,
                limit: 1
            });

            if (cityComponents.length > 0) {
                return true;
            }

            // Check for location components
            const locationComponents = await this.elementFinder.findByCriteria({
                displayName: 'Location',
                visible: true,
                limit: 1
            });

            if (locationComponents.length > 0) {
                return true;
            }

            // Check for city names or location names
            const cityNames = ['Sector-12', 'Aevum', 'Chongqing', 'New Tokyo', 'Ishima', 'Volhaven'];
            for (const cityName of cityNames) {
                const cityText = await this.elementFinder.findByText(cityName, false);
                if (cityText.length > 0) {
                    return true;
                }
            }

            return false;

        } catch (error) {
            console.warn('Error checking city page:', error);
            return false;
        }
    }

    async getPrimaryComponent(): Promise<ReactComponentInfo | null> {
        try {
            // Look for main city component
            const cityComponent = await this.elementFinder.findByCriteria({
                displayName: 'City',
                visible: true,
                limit: 1
            });

            if (cityComponent.length > 0) {
                return cityComponent[0];
            }

            // Fallback to Location component
            const locationComponent = await this.elementFinder.findByCriteria({
                displayName: 'Location',
                visible: true,
                limit: 1
            });

            return locationComponent.length > 0 ? locationComponent[0] : null;

        } catch (error) {
            console.warn('Error getting city primary component:', error);
            return null;
        }
    }

    /**
     * Navigate to a specific location within the current city
     * @param locationName Name of the location
     * @param params Additional parameters for location actions
     * @returns Success status
     */
    async navigateToLocation(locationName: string, params?: any): Promise<boolean> {
        try {
            // Find the specific location
            const locationComponents = await this.elementFinder.findByCriteria({
                textContent: locationName,
                interactive: true,
                customFilter: (component) => {
                    const text = this.extractComponentText(component);
                    return text.includes(locationName) && this.isComponentInteractive(component);
                },
                limit: 1
            });

            if (locationComponents.length === 0) {
                console.warn(`Location ${locationName} not found`);
                return false;
            }

            const locationSuccess = await this.clickComponent(locationComponents[0]);
            if (!locationSuccess) {
                return false;
            }

            // Wait for location page to load
            await this.sleep(1000);

            // Handle specific actions if requested
            if (params?.action) {
                return await this.performLocationAction(params.action, params);
            }

            return true;

        } catch (error) {
            console.warn(`Error navigating to location ${locationName}:`, error);
            return false;
        }
    }

    /**
     * Travel to a different city
     * @param cityName Name of the destination city
     * @returns Success status
     */
    async travelToCity(cityName: string): Promise<boolean> {
        try {
            // Look for travel interface first
            const travelElements = await this.elementFinder.findByCriteria({
                customFilter: (component) => {
                    const text = this.extractComponentText(component);
                    return text.includes('Travel') && this.isComponentInteractive(component);
                },
                sortBy: 'muiPriority',
                limit: 1
            });

            if (travelElements.length > 0) {
                await this.clickComponent(travelElements[0]);
                await this.sleep(1000);
            }

            // Find the destination city
            const cityComponents = await this.elementFinder.findByCriteria({
                textContent: cityName,
                interactive: true,
                customFilter: (component) => {
                    const text = this.extractComponentText(component);
                    return text.includes(cityName) && 
                           (text.includes('Travel') || text.includes('$')) &&
                           this.isComponentInteractive(component);
                },
                limit: 1
            });

            if (cityComponents.length === 0) {
                console.warn(`City ${cityName} not found in travel options`);
                return false;
            }

            return await this.clickComponent(cityComponents[0]);

        } catch (error) {
            console.warn(`Error traveling to city ${cityName}:`, error);
            return false;
        }
    }

    /**
     * Perform a specific action at a location
     * @param action Action to perform ('work', 'info', 'purchase', 'study')
     * @param params Additional parameters for the action
     * @returns Success status
     */
    async performLocationAction(action: 'work' | 'info' | 'purchase' | 'study', params?: any): Promise<boolean> {
        try {
            switch (action) {
                case 'work':
                    return await this.startWork(params?.jobType);
                case 'info':
                    return true; // Already on location page showing info
                case 'purchase':
                    return await this.makePurchase(params?.itemName);
                case 'study':
                    return await this.startStudy(params?.subject);
                default:
                    return false;
            }

        } catch (error) {
            console.warn(`Error performing location action ${action}:`, error);
            return false;
        }
    }

    /**
     * Start work at the current location
     * @param jobType Type of job or work (optional)
     * @returns Success status
     */
    async startWork(jobType?: string): Promise<boolean> {
        try {
            let workButtons: ReactComponentInfo[] = [];

            if (jobType) {
                // Look for specific job type
                workButtons = await this.elementFinder.findByCriteria({
                    textContent: jobType,
                    interactive: true,
                    customFilter: (component) => {
                        const text = this.extractComponentText(component);
                        return text.includes(jobType) && 
                               (text.includes('Work') || text.includes('Apply')) &&
                               this.isComponentInteractive(component);
                    },
                    limit: 1
                });
            } else {
                // Look for any work-related buttons
                workButtons = await this.elementFinder.findByCriteria({
                    customFilter: (component) => {
                        const text = this.extractComponentText(component);
                        return (text.includes('Work') || text.includes('Apply') || text.includes('Job')) &&
                               this.isComponentInteractive(component);
                    },
                    sortBy: 'muiPriority',
                    limit: 1
                });
            }

            if (workButtons.length === 0) {
                console.warn('Work buttons not found');
                return false;
            }

            return await this.clickComponent(workButtons[0]);

        } catch (error) {
            console.warn('Error starting work:', error);
            return false;
        }
    }

    /**
     * Make a purchase at the current location
     * @param itemName Name of item to purchase (optional)
     * @returns Success status
     */
    async makePurchase(itemName?: string): Promise<boolean> {
        try {
            let purchaseButtons: ReactComponentInfo[] = [];

            if (itemName) {
                // Look for specific item
                purchaseButtons = await this.elementFinder.findByCriteria({
                    textContent: itemName,
                    interactive: true,
                    customFilter: (component) => {
                        const text = this.extractComponentText(component);
                        return text.includes(itemName) && 
                               (text.includes('Buy') || text.includes('Purchase') || text.includes('$')) &&
                               this.isComponentInteractive(component);
                    },
                    limit: 1
                });
            } else {
                // Look for any purchase buttons
                purchaseButtons = await this.elementFinder.findByCriteria({
                    customFilter: (component) => {
                        const text = this.extractComponentText(component);
                        return (text.includes('Buy') || text.includes('Purchase')) &&
                               this.isComponentInteractive(component);
                    },
                    sortBy: 'muiPriority',
                    limit: 1
                });
            }

            if (purchaseButtons.length === 0) {
                console.warn('Purchase buttons not found');
                return false;
            }

            return await this.clickComponent(purchaseButtons[0]);

        } catch (error) {
            console.warn('Error making purchase:', error);
            return false;
        }
    }

    /**
     * Start studying at the current location (university, etc.)
     * @param subject Subject to study (optional)
     * @returns Success status
     */
    async startStudy(subject?: string): Promise<boolean> {
        try {
            let studyButtons: ReactComponentInfo[] = [];

            if (subject) {
                // Look for specific subject
                studyButtons = await this.elementFinder.findByCriteria({
                    textContent: subject,
                    interactive: true,
                    customFilter: (component) => {
                        const text = this.extractComponentText(component);
                        return text.includes(subject) && 
                               (text.includes('Study') || text.includes('Take Course') || text.includes('Class')) &&
                               this.isComponentInteractive(component);
                    },
                    limit: 1
                });
            } else {
                // Look for any study buttons
                studyButtons = await this.elementFinder.findByCriteria({
                    customFilter: (component) => {
                        const text = this.extractComponentText(component);
                        return (text.includes('Study') || text.includes('Course') || text.includes('Class')) &&
                               this.isComponentInteractive(component);
                    },
                    sortBy: 'muiPriority',
                    limit: 1
                });
            }

            if (studyButtons.length === 0) {
                console.warn('Study buttons not found');
                return false;
            }

            return await this.clickComponent(studyButtons[0]);

        } catch (error) {
            console.warn('Error starting study:', error);
            return false;
        }
    }

    /**
     * Get current city name
     * @returns Current city name or null
     */
    async getCurrentCity(): Promise<string | null> {
        try {
            const cityNames = ['Sector-12', 'Aevum', 'Chongqing', 'New Tokyo', 'Ishima', 'Volhaven'];
            
            for (const cityName of cityNames) {
                const cityElements = await this.elementFinder.findByCriteria({
                    textContent: cityName,
                    customFilter: (component) => {
                        const text = this.extractComponentText(component);
                        return text.includes(cityName) && 
                               (text.includes('Current') || text.includes('You are in'));
                    },
                    visible: true,
                    limit: 1
                });

                if (cityElements.length > 0) {
                    return cityName;
                }
            }

            return null;

        } catch (error) {
            console.warn('Error getting current city:', error);
            return null;
        }
    }

    /**
     * Get available locations in current city
     * @returns Array of location names or null
     */
    async getAvailableLocations(): Promise<string[] | null> {
        try {
            const locationComponents = await this.elementFinder.findByCriteria({
                interactive: true,
                customFilter: (component) => {
                    const text = this.extractComponentText(component);
                    // Common location types
                    return this.isComponentInteractive(component) &&
                           (text.includes('Corporation') || text.includes('University') ||
                            text.includes('Hospital') || text.includes('Gym') ||
                            text.includes('Bank') || text.includes('Shop') ||
                            text.includes('Company') || text.includes('Casino'));
                },
                visible: true
            });

            const locations: string[] = [];
            for (const component of locationComponents) {
                const locationName = this.extractLocationName(component);
                if (locationName && !locations.includes(locationName)) {
                    locations.push(locationName);
                }
            }

            return locations.length > 0 ? locations : null;

        } catch (error) {
            console.warn('Error getting available locations:', error);
            return null;
        }
    }

    /**
     * Extract location name from component
     * @param component Location component
     * @returns Location name or null
     */
    private extractLocationName(component: ReactComponentInfo): string | null {
        try {
            const text = this.extractComponentText(component);
            const lines = text.split('\n');
            
            // Usually the first line is the location name
            const firstLine = lines[0]?.trim();
            if (firstLine && firstLine.length > 0 && !firstLine.includes('$')) {
                return firstLine;
            }

            return null;

        } catch (error) {
            return null;
        }
    }

    /**
     * Get travel costs to all cities
     * @returns Object mapping city names to travel costs
     */
    async getTravelCosts(): Promise<Record<string, number> | null> {
        try {
            // Navigate to travel interface
            const travelElements = await this.elementFinder.findByCriteria({
                textContent: 'Travel',
                interactive: true,
                limit: 1
            });

            if (travelElements.length > 0) {
                await this.clickComponent(travelElements[0]);
                await this.sleep(1000);
            }

            const costs: Record<string, number> = {};
            const cityNames = ['Sector-12', 'Aevum', 'Chongqing', 'New Tokyo', 'Ishima', 'Volhaven'];

            for (const cityName of cityNames) {
                const cityElements = await this.elementFinder.findByCriteria({
                    textContent: cityName,
                    customFilter: (component) => {
                        const text = this.extractComponentText(component);
                        return text.includes(cityName) && text.includes('$');
                    },
                    visible: true,
                    limit: 1
                });

                if (cityElements.length > 0) {
                    const text = this.extractComponentText(cityElements[0]);
                    const costMatch = text.match(/\$?([\d,]+)/);
                    if (costMatch) {
                        costs[cityName] = parseInt(costMatch[1].replace(/,/g, ''), 10);
                    }
                }
            }

            return Object.keys(costs).length > 0 ? costs : null;

        } catch (error) {
            console.warn('Error getting travel costs:', error);
            return null;
        }
    }
}