import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('GitHub Actions Workflow', () => {
  let workflowContent;

  // Load the workflow file
  try {
    workflowContent = readFileSync(
      join(process.cwd(), '.github/workflows/ikfast.yml'),
      'utf-8'
    );
  } catch (error) {
    console.error('Failed to load workflow file:', error);
  }

  describe('YAML Syntax Validation', () => {
    it('should have valid workflow file', () => {
      expect(workflowContent).toBeDefined();
      expect(workflowContent.length).toBeGreaterThan(0);
    });

    it('should have workflow name', () => {
      expect(workflowContent).toContain('name: IKFast Generator');
    });

    it('should have workflow_dispatch trigger', () => {
      expect(workflowContent).toContain('workflow_dispatch:');
    });

    it('should define required inputs', () => {
      expect(workflowContent).toContain('mode:');
      expect(workflowContent).toContain('base_link:');
      expect(workflowContent).toContain('ee_link:');
      expect(workflowContent).toContain('iktype:');
    });

    it('should have mode as choice input with info and generate options', () => {
      expect(workflowContent).toContain('type: choice');
      expect(workflowContent).toContain('- info');
      expect(workflowContent).toContain('- generate');
    });

    it('should have default iktype value', () => {
      expect(workflowContent).toContain("default: 'transform6d'");
    });
  });

  describe('Workflow Configuration', () => {
    it('should have concurrency control', () => {
      expect(workflowContent).toContain('concurrency:');
      expect(workflowContent).toContain('group: ikfast-generation');
      expect(workflowContent).toContain('cancel-in-progress: false');
    });

    it('should have 30-minute timeout', () => {
      expect(workflowContent).toContain('timeout-minutes: 30');
    });

    it('should run on ubuntu-latest', () => {
      expect(workflowContent).toContain('runs-on: ubuntu-latest');
    });
  });

  describe('Workflow Steps', () => {
    it('should checkout repository', () => {
      expect(workflowContent).toContain('Checkout repository');
      expect(workflowContent).toContain('actions/checkout@v3');
    });

    it('should validate inputs', () => {
      expect(workflowContent).toContain('Validate inputs');
      expect(workflowContent).toContain('base_link and ee_link are required for generate mode');
    });

    it('should have info mode step', () => {
      expect(workflowContent).toContain('Run IKFast in Docker (Info Mode)');
      expect(workflowContent).toContain("if: inputs.mode == 'info'");
    });

    it('should have generate mode step', () => {
      expect(workflowContent).toContain('Run IKFast in Docker (Generate Mode)');
      expect(workflowContent).toContain("if: inputs.mode == 'generate'");
    });

    it('should verify output file integrity', () => {
      expect(workflowContent).toContain('Verify output file integrity');
      expect(workflowContent).toContain('ikfast_solver.cpp file is missing');
      expect(workflowContent).toContain('ikfast_solver.cpp file is empty');
    });

    it('should upload artifacts', () => {
      expect(workflowContent).toContain('Upload artifacts');
      expect(workflowContent).toContain('actions/upload-artifact@v3');
      expect(workflowContent).toContain('if: always()');
    });
  });

  describe('Docker Configuration', () => {
    it('should use fishros2/openrave image', () => {
      expect(workflowContent).toContain('fishros2/openrave');
    });

    it('should mount workspace to /ws', () => {
      expect(workflowContent).toContain('-v ${GITHUB_WORKSPACE}:/ws');
      expect(workflowContent).toContain('-w /ws');
    });

    it('should run with --rm flag for cleanup', () => {
      expect(workflowContent).toContain('--rm');
    });
  });

  describe('Info Mode Workflow', () => {
    it('should convert URDF to Collada', () => {
      expect(workflowContent).toContain('rosrun collada_urdf urdf_to_collada');
      expect(workflowContent).toContain('jobs/current/robot.urdf');
      expect(workflowContent).toContain('robot.dae');
    });

    it('should extract link information', () => {
      expect(workflowContent).toContain('openrave-robot.py robot.dae --info links');
    });

    it('should output to info.log', () => {
      expect(workflowContent).toContain('outputs/info.log');
    });

    it('should have STEP markers', () => {
      const infoModeSection = workflowContent.substring(
        workflowContent.indexOf('Run IKFast in Docker (Info Mode)'),
        workflowContent.indexOf('Run IKFast in Docker (Generate Mode)')
      );
      expect(infoModeSection).toContain('=== STEP 1: URDF to Collada ===');
      expect(infoModeSection).toContain('=== STEP 2: Verify Collada File ===');
      expect(infoModeSection).toContain('=== STEP 3: Extract Link Information ===');
    });
  });

  describe('Generate Mode Workflow', () => {
    it('should convert URDF to Collada', () => {
      expect(workflowContent).toContain('rosrun collada_urdf urdf_to_collada');
    });

    it('should generate IKFast solver with parameters', () => {
      expect(workflowContent).toContain('ikfast.py');
      expect(workflowContent).toContain('--robot=robot.dae');
      expect(workflowContent).toContain('--iktype=${{ inputs.iktype }}');
      expect(workflowContent).toContain('--baselink=${{ inputs.base_link }}');
      expect(workflowContent).toContain('--eelink=${{ inputs.ee_link }}');
      expect(workflowContent).toContain('--savefile=outputs/ikfast_solver.cpp');
    });

    it('should verify output file', () => {
      expect(workflowContent).toContain('ls -lh outputs/ikfast_solver.cpp');
      expect(workflowContent).toContain('wc -l outputs/ikfast_solver.cpp');
    });

    it('should compute checksum', () => {
      expect(workflowContent).toContain('sha256sum outputs/ikfast_solver.cpp');
    });

    it('should output to build.log', () => {
      expect(workflowContent).toContain('outputs/build.log');
    });

    it('should have STEP markers', () => {
      const generateModeSection = workflowContent.substring(
        workflowContent.indexOf('Run IKFast in Docker (Generate Mode)')
      );
      expect(generateModeSection).toContain('=== STEP 1: URDF to Collada ===');
      expect(generateModeSection).toContain('=== STEP 2: Verify Collada File ===');
      expect(generateModeSection).toContain('=== STEP 3: Generate IKFast Solver ===');
      expect(generateModeSection).toContain('=== STEP 4: Verify Output ===');
      expect(generateModeSection).toContain('=== STEP 5: Compute Checksum ===');
    });
  });

  describe('Artifact Upload', () => {
    it('should upload outputs directory', () => {
      expect(workflowContent).toContain('path: outputs/');
    });

    it('should name artifact ikfast-result', () => {
      expect(workflowContent).toContain('name: ikfast-result');
    });

    it('should have 7-day retention', () => {
      expect(workflowContent).toContain('retention-days: 7');
    });

    it('should upload artifacts even on failure', () => {
      expect(workflowContent).toContain('if: always()');
    });
  });

  describe('Input Validation', () => {
    it('should validate base_link and ee_link are required for generate mode', () => {
      const validationSection = workflowContent.substring(
        workflowContent.indexOf('Validate inputs'),
        workflowContent.indexOf('Run IKFast in Docker')
      );
      expect(validationSection).toContain('if [ "${{ inputs.mode }}" = "generate" ]');
      expect(validationSection).toContain('base_link and ee_link are required for generate mode');
    });

    it('should validate base_link is non-negative integer', () => {
      expect(workflowContent).toContain('base_link must be a non-negative integer');
    });

    it('should validate ee_link is non-negative integer', () => {
      expect(workflowContent).toContain('ee_link must be a non-negative integer');
    });

    it('should validate base_link != ee_link', () => {
      expect(workflowContent).toContain('base_link and ee_link must be different');
    });
  });

  describe('Error Handling', () => {
    it('should exit with error if output file is missing', () => {
      expect(workflowContent).toContain('ikfast_solver.cpp was not generated');
      expect(workflowContent).toContain('exit 1');
    });

    it('should use set -e for error propagation', () => {
      expect(workflowContent).toContain('set -e');
    });

    it('should capture both stdout and stderr', () => {
      expect(workflowContent).toContain('2>&1');
    });
  });

  describe('Log Output', () => {
    it('should use tee to capture logs', () => {
      expect(workflowContent).toContain('| tee outputs/');
    });

    it('should create outputs directory', () => {
      expect(workflowContent).toContain('mkdir -p outputs');
    });
  });
});
