export declare const subscriptionRepository: {
    findForUserAndYear(userId: string, fiscalYear: number): Promise<any>;
    createPending(input: {
        userId: string;
        tierId: string;
        fiscalYear: number;
        amountDue: number;
    }): Promise<{
        renewalStatus: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        userId: string;
        tierId: string;
        fiscalYear: number;
        amountDue: number;
        _id: `${string}-${string}-${string}-${string}-${string}`;
        id: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    activate(id: string, startsAt?: Date): Promise<any>;
};
