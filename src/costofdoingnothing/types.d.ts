export interface Lender {
    MasterLenderId: number;
    Lender: string;
    ResidentialRate: number;
    BuyToLetRate: number;
    LenderURL: string | null;
    ResidentialRetentionProductCount: number | null;
    BuyToLetRetentionProductCount: number | null;
}