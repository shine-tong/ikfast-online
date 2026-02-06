/**
 * Unit Tests for LinkInfoComponent
 * Tests specific examples, edge cases, and UI interactions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LinkInfoComponent } from '../web/link-info.module.js';

describe('LinkInfoComponent - Unit Tests', () => {
    let component;
    let mockGitHubAPIClient;
    
    beforeEach(() => {
        // Create mock GitHub API client
        mockGitHubAPIClient = {
            triggerWorkflow: vi.fn(),
            getMostRecentWorkflowRun: vi.fn(),
            getWorkflowRun: vi.fn(),
            listArtifacts: vi.fn(),
            downloadArtifact: vi.fn(),
            getWorkflowLogs: vi.fn()
        };
        
        component = new LinkInfoComponent(mockGitHubAPIClient);
    });
    
    describe('parseLinkInfo', () => {
        it('should parse sample OpenRAVE output correctly', () => {
            const sampleOutput = `
=== STEP 2: Extract Link Information ===
openrave-robot.py robot.dae --info links
name index parents
base_link 0 
link1 1 base_link(0)
link2 2 link1(1)
link3 3 link2(2)
ee_link 4 link3(3)
=== INFO MODE COMPLETE ===
            `;
            
            const links = component.parseLinkInfo(sampleOutput);
            
            expect(links).toHaveLength(5);
            expect(links[0]).toEqual({
                name: 'base_link',
                index: 0,
                parent: null,
                isRoot: true,
                isLeaf: false
            });
            expect(links[4]).toEqual({
                name: 'ee_link',
                index: 4,
                parent: 'link3',
                isRoot: false,
                isLeaf: true
            });
        });
        
        it('should handle robot with multiple root links', () => {
            const output = `
=== STEP 2: Extract Link Information ===
name index parents
root1 0 
root2 1 
child1 2 root1(0)
child2 3 root2(1)
=== INFO MODE COMPLETE ===
            `;
            
            const links = component.parseLinkInfo(output);
            
            expect(links).toHaveLength(4);
            expect(links[0].isRoot).toBe(true);
            expect(links[1].isRoot).toBe(true);
            expect(links[2].isRoot).toBe(false);
            expect(links[3].isRoot).toBe(false);
        });
        
        it('should handle robot with branching structure', () => {
            const output = `
=== STEP 2: Extract Link Information ===
name index parents
base 0 
arm1 1 base(0)
arm2 2 base(0)
gripper1 3 arm1(1)
gripper2 4 arm2(2)
=== INFO MODE COMPLETE ===
            `;
            
            const links = component.parseLinkInfo(output);
            
            expect(links).toHaveLength(5);
            expect(links[0].isLeaf).toBe(false); // base has children
            expect(links[1].isLeaf).toBe(false); // arm1 has children
            expect(links[2].isLeaf).toBe(false); // arm2 has children
            expect(links[3].isLeaf).toBe(true);  // gripper1 is leaf
            expect(links[4].isLeaf).toBe(true);  // gripper2 is leaf
        });
        
        it('should return empty array for output without link info', () => {
            const output = 'Some random output without link information';
            const links = component.parseLinkInfo(output);
            expect(links).toEqual([]);
        });
        
        it('should return empty array for empty output', () => {
            const links = component.parseLinkInfo('');
            expect(links).toEqual([]);
        });
    });
    
    describe('renderLinkTable', () => {
        let container;
        
        beforeEach(() => {
            container = document.createElement('div');
            component.initializeUI({ linkTable: container });
        });
        
        it('should render table with correct structure', () => {
            const links = [
                { name: 'base', index: 0, parent: null, isRoot: true, isLeaf: false },
                { name: 'link1', index: 1, parent: 'base', isRoot: false, isLeaf: false },
                { name: 'ee', index: 2, parent: 'link1', isRoot: false, isLeaf: true }
            ];
            
            component.renderLinkTable(links);
            
            const table = container.querySelector('table.link-table');
            expect(table).toBeTruthy();
            
            const headers = table.querySelectorAll('thead th');
            expect(headers).toHaveLength(3);
            expect(headers[0].textContent).toBe('Index');
            expect(headers[1].textContent).toBe('Name');
            expect(headers[2].textContent).toBe('Parent');
            
            const rows = table.querySelectorAll('tbody tr.link-row');
            expect(rows).toHaveLength(3);
        });
        
        it('should apply root-link class to root links', () => {
            const links = [
                { name: 'base', index: 0, parent: null, isRoot: true, isLeaf: false },
                { name: 'link1', index: 1, parent: 'base', isRoot: false, isLeaf: true }
            ];
            
            component.renderLinkTable(links);
            
            const rows = container.querySelectorAll('tbody tr.link-row');
            expect(rows[0].classList.contains('root-link')).toBe(true);
            expect(rows[1].classList.contains('root-link')).toBe(false);
        });
        
        it('should apply leaf-link class to leaf links', () => {
            const links = [
                { name: 'base', index: 0, parent: null, isRoot: true, isLeaf: false },
                { name: 'ee', index: 1, parent: 'base', isRoot: false, isLeaf: true }
            ];
            
            component.renderLinkTable(links);
            
            const rows = container.querySelectorAll('tbody tr.link-row');
            expect(rows[0].classList.contains('leaf-link')).toBe(false);
            expect(rows[1].classList.contains('leaf-link')).toBe(true);
        });
        
        it('should display "(none)" for links with no parent', () => {
            const links = [
                { name: 'base', index: 0, parent: null, isRoot: true, isLeaf: false }
            ];
            
            component.renderLinkTable(links);
            
            const parentCell = container.querySelector('tbody tr td:nth-child(3)');
            expect(parentCell.textContent).toBe('(none)');
        });
        
        it('should render legend explaining link highlighting', () => {
            const links = [
                { name: 'base', index: 0, parent: null, isRoot: true, isLeaf: true }
            ];
            
            component.renderLinkTable(links);
            
            const legend = container.querySelector('.link-legend');
            expect(legend).toBeTruthy();
            expect(legend.textContent).toContain('Root Link');
            expect(legend.textContent).toContain('Leaf Link');
        });
    });
    
    describe('handleLinkSelect', () => {
        let container;
        let eventListener;
        let capturedEvent;
        
        beforeEach(() => {
            container = document.createElement('div');
            component.initializeUI({ linkTable: container });
            
            capturedEvent = null;
            eventListener = (e) => {
                capturedEvent = e.detail;
            };
            window.addEventListener('linkSelected', eventListener);
        });
        
        afterEach(() => {
            window.removeEventListener('linkSelected', eventListener);
        });
        
        it('should dispatch linkSelected event when link is clicked', () => {
            const links = [
                { name: 'base', index: 0, parent: null, isRoot: true, isLeaf: false },
                { name: 'ee', index: 1, parent: 'base', isRoot: false, isLeaf: true }
            ];
            
            component.renderLinkTable(links);
            
            const rows = container.querySelectorAll('tbody tr.link-row');
            rows[1].click();
            
            expect(capturedEvent).toBeTruthy();
            expect(capturedEvent.index).toBe(1);
            expect(capturedEvent.name).toBe('ee');
            expect(capturedEvent.isRoot).toBe(false);
            expect(capturedEvent.isLeaf).toBe(true);
        });
        
        it('should highlight the clicked row', () => {
            const links = [
                { name: 'base', index: 0, parent: null, isRoot: true, isLeaf: false },
                { name: 'link1', index: 1, parent: 'base', isRoot: false, isLeaf: false },
                { name: 'ee', index: 2, parent: 'link1', isRoot: false, isLeaf: true }
            ];
            
            component.renderLinkTable(links);
            
            const rows = container.querySelectorAll('tbody tr.link-row');
            rows[1].click();
            
            expect(rows[1].classList.contains('selected')).toBe(true);
            expect(rows[0].classList.contains('selected')).toBe(false);
            expect(rows[2].classList.contains('selected')).toBe(false);
        });
        
        it('should remove previous selection when new link is clicked', () => {
            const links = [
                { name: 'base', index: 0, parent: null, isRoot: true, isLeaf: false },
                { name: 'ee', index: 1, parent: 'base', isRoot: false, isLeaf: true }
            ];
            
            component.renderLinkTable(links);
            
            const rows = container.querySelectorAll('tbody tr.link-row');
            
            // Click first row
            rows[0].click();
            expect(rows[0].classList.contains('selected')).toBe(true);
            
            // Click second row
            rows[1].click();
            expect(rows[0].classList.contains('selected')).toBe(false);
            expect(rows[1].classList.contains('selected')).toBe(true);
        });
    });
    
    describe('enrichLinkData', () => {
        it('should correctly identify root links', () => {
            const links = [
                { name: 'base', index: 0, parent: null },
                { name: 'link1', index: 1, parent: 'base' }
            ];
            
            const enriched = component.enrichLinkData(links);
            
            expect(enriched[0].isRoot).toBe(true);
            expect(enriched[1].isRoot).toBe(false);
        });
        
        it('should correctly identify leaf links', () => {
            const links = [
                { name: 'base', index: 0, parent: null },
                { name: 'link1', index: 1, parent: 'base' },
                { name: 'ee', index: 2, parent: 'link1' }
            ];
            
            const enriched = component.enrichLinkData(links);
            
            expect(enriched[0].isLeaf).toBe(false); // base has children
            expect(enriched[1].isLeaf).toBe(false); // link1 has children
            expect(enriched[2].isLeaf).toBe(true);  // ee has no children
        });
        
        it('should handle single link (both root and leaf)', () => {
            const links = [
                { name: 'only_link', index: 0, parent: null }
            ];
            
            const enriched = component.enrichLinkData(links);
            
            expect(enriched[0].isRoot).toBe(true);
            expect(enriched[0].isLeaf).toBe(true);
        });
    });
    
    describe('getLinkByIndex', () => {
        beforeEach(() => {
            component.links = [
                { name: 'base', index: 0, parent: null, isRoot: true, isLeaf: false },
                { name: 'link1', index: 1, parent: 'base', isRoot: false, isLeaf: false },
                { name: 'ee', index: 2, parent: 'link1', isRoot: false, isLeaf: true }
            ];
        });
        
        it('should return link with matching index', () => {
            const link = component.getLinkByIndex(1);
            expect(link).toBeTruthy();
            expect(link.name).toBe('link1');
        });
        
        it('should return null for non-existent index', () => {
            const link = component.getLinkByIndex(99);
            expect(link).toBeNull();
        });
    });
    
    describe('getLinkByName', () => {
        beforeEach(() => {
            component.links = [
                { name: 'base', index: 0, parent: null, isRoot: true, isLeaf: false },
                { name: 'link1', index: 1, parent: 'base', isRoot: false, isLeaf: false },
                { name: 'ee', index: 2, parent: 'link1', isRoot: false, isLeaf: true }
            ];
        });
        
        it('should return link with matching name', () => {
            const link = component.getLinkByName('link1');
            expect(link).toBeTruthy();
            expect(link.index).toBe(1);
        });
        
        it('should return null for non-existent name', () => {
            const link = component.getLinkByName('nonexistent');
            expect(link).toBeNull();
        });
    });
});
