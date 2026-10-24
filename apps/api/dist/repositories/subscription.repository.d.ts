export declare const subscriptionRepository: {
    findForUserAndYear(userId: string, fiscalYear: number): any;
    createPending(input: {
        userId: string;
        tierId: string;
        fiscalYear: number;
        amountDue: number;
    }): any;
    activate(id: string, startsAt?: Date): any;
};
