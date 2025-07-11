import { 
  SquareClient, 
  SquareEnvironment,
  Dispute,
  DisputeEvidence,
  CreateDisputeEvidenceFileRequest,
  CreateDisputeEvidenceFileResponse,
  CreateDisputeEvidenceTextRequest,
  CreateDisputeEvidenceTextResponse,
  ListDisputesResponse,
  RetrieveDisputeResponse,
  ListDisputeEvidenceResponse,
  RemoveDisputeEvidenceResponse,
  SubmitEvidenceResponse,
  AcceptDisputeResponse
} from "square";
import { readFileSync } from 'fs';
import { nanoid } from "nanoid";

export interface DisputeResult {
  success: boolean;
  dispute?: Dispute;
  error?: string;
  errorCode?: string;
}

export interface DisputeListResult {
  success: boolean;
  disputes?: Dispute[];
  cursor?: string;
  error?: string;
}

export interface EvidenceResult {
  success: boolean;
  evidence?: DisputeEvidence;
  evidenceId?: string;
  error?: string;
}

export class SquareDisputesService {
  private client: SquareClient;
  private locationId: string;
  private isInitialized: boolean = false;

  constructor() {
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      console.warn("Square access token not provided. Disputes features will be limited.");
      return;
    }

    this.locationId = process.env.SQUARE_LOCATION_ID || '';

    const environment = process.env.SQUARE_ACCESS_TOKEN.startsWith('sandbox') 
      ? SquareEnvironment.Sandbox 
      : SquareEnvironment.Production;

    this.client = new SquareClient({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: environment
    });

    this.isInitialized = true;
    console.log(`Square Disputes Service initialized`);
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * List all disputes
   */
  async listDisputes(
    states?: string[],
    cursor?: string,
    limit?: number
  ): Promise<DisputeListResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Disputes Service not initialized'
      };
    }

    try {
      const disputesApi = this.client.disputesApi;
      const response: ListDisputesResponse = await disputesApi.listDisputes(
        cursor,
        states,
        this.locationId,
        limit
      );

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to list disputes'
        };
      }

      return {
        success: true,
        disputes: response.result.disputes || [],
        cursor: response.result.cursor
      };
    } catch (error: any) {
      console.error('List disputes error:', error);
      return {
        success: false,
        error: error.message || 'Failed to list disputes'
      };
    }
  }

  /**
   * Get dispute details
   */
  async getDispute(disputeId: string): Promise<DisputeResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Disputes Service not initialized'
      };
    }

    try {
      const disputesApi = this.client.disputesApi;
      const response: RetrieveDisputeResponse = await disputesApi.retrieveDispute(disputeId);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to get dispute',
          errorCode: error.code
        };
      }

      if (!response.result.dispute) {
        return {
          success: false,
          error: 'Dispute not found',
          errorCode: 'NOT_FOUND'
        };
      }

      return {
        success: true,
        dispute: response.result.dispute
      };
    } catch (error: any) {
      console.error('Get dispute error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get dispute',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Accept a dispute (lose the dispute)
   */
  async acceptDispute(disputeId: string): Promise<DisputeResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Disputes Service not initialized'
      };
    }

    try {
      const disputesApi = this.client.disputesApi;
      const response: AcceptDisputeResponse = await disputesApi.acceptDispute(disputeId);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to accept dispute',
          errorCode: error.code
        };
      }

      if (!response.result.dispute) {
        return {
          success: false,
          error: 'Failed to accept dispute',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      console.log(`Dispute ${disputeId} accepted`);
      return {
        success: true,
        dispute: response.result.dispute
      };
    } catch (error: any) {
      console.error('Accept dispute error:', error);
      return {
        success: false,
        error: error.message || 'Failed to accept dispute',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Upload text evidence for a dispute
   */
  async uploadTextEvidence(
    disputeId: string,
    evidenceType: string,
    evidenceText: string
  ): Promise<EvidenceResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Disputes Service not initialized'
      };
    }

    try {
      const disputesApi = this.client.disputesApi;
      const idempotencyKey = `evidence-text-${nanoid()}`;

      const request: CreateDisputeEvidenceTextRequest = {
        idempotencyKey,
        evidenceType,
        evidenceText
      };

      const response: CreateDisputeEvidenceTextResponse = await disputesApi.createDisputeEvidenceText(
        disputeId,
        request
      );

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to upload text evidence'
        };
      }

      if (!response.result.evidence) {
        return {
          success: false,
          error: 'No evidence returned'
        };
      }

      console.log(`Text evidence uploaded for dispute ${disputeId}`);
      return {
        success: true,
        evidence: response.result.evidence,
        evidenceId: response.result.evidence.id
      };
    } catch (error: any) {
      console.error('Upload text evidence error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload text evidence'
      };
    }
  }

  /**
   * Upload file evidence for a dispute
   */
  async uploadFileEvidence(
    disputeId: string,
    evidenceType: string,
    filePath: string,
    contentType: string = 'image/jpeg'
  ): Promise<EvidenceResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Disputes Service not initialized'
      };
    }

    try {
      const disputesApi = this.client.disputesApi;
      const idempotencyKey = `evidence-file-${nanoid()}`;
      
      // Read file content
      const fileContent = readFileSync(filePath);

      const request: CreateDisputeEvidenceFileRequest = {
        idempotencyKey,
        evidenceType,
        contentType
      };

      const fileWrapper = {
        file: fileContent,
        options: {
          filename: filePath.split('/').pop() || 'evidence.jpg',
          contentType: contentType
        }
      };

      const response: CreateDisputeEvidenceFileResponse = await disputesApi.createDisputeEvidenceFile(
        disputeId,
        request,
        fileWrapper
      );

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to upload file evidence'
        };
      }

      if (!response.result.evidence) {
        return {
          success: false,
          error: 'No evidence returned'
        };
      }

      console.log(`File evidence uploaded for dispute ${disputeId}`);
      return {
        success: true,
        evidence: response.result.evidence,
        evidenceId: response.result.evidence.id
      };
    } catch (error: any) {
      console.error('Upload file evidence error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload file evidence'
      };
    }
  }

  /**
   * List evidence for a dispute
   */
  async listEvidence(
    disputeId: string,
    cursor?: string
  ): Promise<{
    success: boolean;
    evidence?: DisputeEvidence[];
    cursor?: string;
    error?: string;
  }> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Disputes Service not initialized'
      };
    }

    try {
      const disputesApi = this.client.disputesApi;
      const response: ListDisputeEvidenceResponse = await disputesApi.listDisputeEvidence(
        disputeId,
        cursor
      );

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to list evidence'
        };
      }

      return {
        success: true,
        evidence: response.result.evidence || [],
        cursor: response.result.cursor
      };
    } catch (error: any) {
      console.error('List evidence error:', error);
      return {
        success: false,
        error: error.message || 'Failed to list evidence'
      };
    }
  }

  /**
   * Remove evidence from a dispute
   */
  async removeEvidence(
    disputeId: string,
    evidenceId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Disputes Service not initialized'
      };
    }

    try {
      const disputesApi = this.client.disputesApi;
      const response: RemoveDisputeEvidenceResponse = await disputesApi.removeDisputeEvidence(
        disputeId,
        evidenceId
      );

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to remove evidence'
        };
      }

      console.log(`Evidence ${evidenceId} removed from dispute ${disputeId}`);
      return {
        success: true
      };
    } catch (error: any) {
      console.error('Remove evidence error:', error);
      return {
        success: false,
        error: error.message || 'Failed to remove evidence'
      };
    }
  }

  /**
   * Submit evidence for a dispute
   */
  async submitEvidence(disputeId: string): Promise<DisputeResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Square Disputes Service not initialized'
      };
    }

    try {
      const disputesApi = this.client.disputesApi;
      const response: SubmitEvidenceResponse = await disputesApi.submitEvidence(disputeId);

      if (response.result.errors && response.result.errors.length > 0) {
        const error = response.result.errors[0];
        return {
          success: false,
          error: error.detail || 'Failed to submit evidence',
          errorCode: error.code
        };
      }

      if (!response.result.dispute) {
        return {
          success: false,
          error: 'Failed to submit evidence',
          errorCode: 'INVALID_RESPONSE'
        };
      }

      console.log(`Evidence submitted for dispute ${disputeId}`);
      return {
        success: true,
        dispute: response.result.dispute
      };
    } catch (error: any) {
      console.error('Submit evidence error:', error);
      return {
        success: false,
        error: error.message || 'Failed to submit evidence',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Get dispute state display information
   */
  getDisputeStateInfo(state: string): {
    label: string;
    color: string;
    description: string;
  } {
    const stateInfo: Record<string, any> = {
      INQUIRY_EVIDENCE_REQUIRED: {
        label: 'Evidence Required',
        color: 'warning',
        description: 'Square is requesting evidence to resolve this inquiry'
      },
      INQUIRY_PROCESSING: {
        label: 'Inquiry Processing',
        color: 'info',
        description: 'Square is processing the inquiry'
      },
      INQUIRY_CLOSED: {
        label: 'Inquiry Closed',
        color: 'success',
        description: 'The inquiry has been resolved in your favor'
      },
      EVIDENCE_REQUIRED: {
        label: 'Evidence Required',
        color: 'error',
        description: 'You must submit evidence to challenge this dispute'
      },
      PROCESSING: {
        label: 'Processing',
        color: 'info',
        description: 'The card network is reviewing your evidence'
      },
      WON: {
        label: 'Won',
        color: 'success',
        description: 'You won the dispute and funds were returned'
      },
      LOST: {
        label: 'Lost',
        color: 'error',
        description: 'The dispute was resolved in favor of the cardholder'
      },
      ACCEPTED: {
        label: 'Accepted',
        color: 'default',
        description: 'You accepted liability for the dispute'
      }
    };

    return stateInfo[state] || {
      label: state,
      color: 'default',
      description: 'Unknown dispute state'
    };
  }
}

// Export singleton instance
export const squareDisputesService = new SquareDisputesService();