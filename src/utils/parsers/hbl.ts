/**
 * HBL (Habib Bank Limited) Parser
 * 
 * Parses HBL bank statement PDFs and extracts transaction data.
 */

import { ParsedTransaction } from './types.ts';

export function detectHBL(pdfText: string): boolean {
  const hblIndicators = [
    'HBL Mobile',
    'Habib Bank',
    'Account Activity generated through HBL',
    'IBAN: PK',
    'Transaction\n Date',
    'Value Date',
    'Account Number',
    'CNIC Number'
  ];
  
  const lowerText = pdfText.toLowerCase();
  let matchCount = 0;
  
  for (const indicator of hblIndicators) {
    if (pdfText.includes(indicator) || lowerText.includes(indicator.toLowerCase())) {
      matchCount++;
    }
  }
  
  return matchCount >= 3;
}

function isTransactionSectionStart(line: string): boolean {
  return line.includes('Transaction');
}

function isHeaderLine(line: string): boolean {
  return line.includes('Date') && line.includes('Description') && line.includes('Debit') && line.includes('Credit') && line.includes('Balance');
}

function processCurrentTransaction(currentTransaction: string[], transactions: ParsedTransaction[]): void {
  if (currentTransaction.length > 0) {
    const txn = parseHBLTransaction(currentTransaction);
    if (txn) {
      transactions.push(txn);
    }
  }
}

function handleTransactionLine(line: string, currentTransaction: string[], transactions: ParsedTransaction[]): string[] {
  const datePattern = /^(\d{2}-\d{2}-\d{4})\s+/;
  if (datePattern.test(line)) {
    processCurrentTransaction(currentTransaction, transactions);
    return [line];
  } else if (currentTransaction.length > 0) {
    currentTransaction.push(line);
    return currentTransaction;
  }
  return currentTransaction;
}

export function parseHBLText(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split('\n');
  
  let inTransactionSection = false;
  let currentTransaction: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (isTransactionSectionStart(trimmedLine)) {
      inTransactionSection = true;
      continue;
    }
    
    if (inTransactionSection && isHeaderLine(trimmedLine)) {
      continue;
    }
    
    if (!trimmedLine) {
      processCurrentTransaction(currentTransaction, transactions);
      currentTransaction = [];
      continue;
    }
    
    if (inTransactionSection) {
      currentTransaction = handleTransactionLine(trimmedLine, currentTransaction, transactions);
    }
  }
  
  processCurrentTransaction(currentTransaction, transactions);
  
  console.log(`Parsed ${transactions.length} HBL transactions`);
  return transactions;
}

function parseHBLTransaction(lines: string[]): ParsedTransaction | null {
  if (lines.length === 0) return null;
  
  const firstLine = lines[0];
  
  // Extract date (format: DD-MM-YYYY)
  const dateMatch = /^(\d{2}-\d{2}-\d{4})/.exec(firstLine);
  if (!dateMatch) return null;
  
  const dateStr = dateMatch[1];
  const [day, month, year] = dateStr.split('-');
  const isoDate = `${year}-${month}-${day}`;
  
  // Extract amounts from FIRST LINE ONLY (amounts are always on first line)
  // HBL format: Date ValueDate Description Amount Balance
  // Amount is either Debit OR Credit (only one column filled)
  let debit = 0;
  let credit = 0;
  
  // Extract the last 2 amounts from first line (amount and balance)
  const amountPattern = /\s+([\d,]+\.\d+)\s+([\d,]+\.\d+)\s*$/;
  const amountMatch = amountPattern.exec(firstLine);
  
  if (amountMatch) {
    const amount = Number.parseFloat(amountMatch[1].replaceAll(',', ''));
    // The balance is amountMatch[2], but we don't need it
    
    // Join all lines to get full description for keyword detection
    const fullText = lines.join(' ').toLowerCase();
    
    // Determine if it's debit or credit based on keywords
    if (fullText.includes(' fr ') || 
        fullText.includes(' from ') ||
        fullText.includes('transfer fr') ||
        fullText.includes('received')) {
      credit = amount;
    } else {
      debit = amount;
    }
  }
  
  // Extract description from all lines
  const fullText = lines.join(' ');
  const description = cleanHBLDescription(fullText, dateStr);
  
  if (!description || (debit === 0 && credit === 0)) {
    return null;
  }
  
  return {
    originalDate: dateStr,
    date: isoDate,
    debit,
    credit,
    description
  };
}

function cleanHBLDescription(fullText: string, dateStr: string): string {
  // Remove both dates at the start (transaction date and value date)
  let cleaned = fullText.replaceAll(dateStr, '').trim();
  cleaned = cleaned.replaceAll(/^\d{2}-\d{2}-\d{4}\s+/g, '').trim();
  
  // Remove all amounts at the end (amounts can have varying decimal places)
  cleaned = cleaned.replaceAll(/\s+[\d,]+\.\d+\s+[\d,]+\.\d+\s+[\d,]+\.\d+\s+[\d,]+\.\d+\s*$/g, ''); // 4 amounts
  cleaned = cleaned.replaceAll(/\s+[\d,]+\.\d+\s+[\d,]+\.\d+\s+[\d,]+\.\d+\s*$/g, ''); // 3 amounts
  cleaned = cleaned.replaceAll(/\s+[\d,]+\.\d+\s+[\d,]+\.\d+\s*$/g, ''); // 2 amounts
  cleaned = cleaned.replaceAll(/\s+[\d,]+\.\d+\s*$/g, ''); // 1 amount
  
  // Remove currency amounts anywhere in the description (Rs 3,000, PKR 500, etc.)
  cleaned = cleaned.replaceAll(/\bRs\s*[\d,]+\.?\d*\b/gi, ''); // Rs 3000, Rs3,000, etc.
  cleaned = cleaned.replaceAll(/\bPKR\s*[\d,]+\.?\d*\b/gi, ''); // PKR 3000, etc.
  cleaned = cleaned.replaceAll(/\bUSD\s*[\d,]+\.?\d*\b/gi, ''); // USD 3000, etc.
  cleaned = cleaned.replaceAll(/\b[\d,]+\.\d+\b/g, ''); // Any decimal amounts like 3,000.00
  
  // Remove account numbers, IBANs, and other long numbers
  cleaned = cleaned.replaceAll(/\b\d{10,}\b/g, ''); // Remove long numbers (account numbers, etc.)
  cleaned = cleaned.replaceAll(/\bPK\d+\b/g, ''); // Remove IBAN prefixes
  cleaned = cleaned.replaceAll(/\b\d{4}-\d{4}-\d{4}-\d{4}\b/g, ''); // Remove card numbers
  
  // Remove common bank noise
  cleaned = cleaned.replaceAll(/\bHBL\b/gi, '');
  cleaned = cleaned.replaceAll(/\bHabib Bank\b/gi, '');
  cleaned = cleaned.replaceAll(/\bMobile\b/gi, '');
  cleaned = cleaned.replaceAll(/\bTransfer\b/gi, '');
  cleaned = cleaned.replaceAll(/\bTransaction\b/gi, '');
  // Remove Thru Raast
  cleaned = cleaned.replaceAll(/\bThru Raast\b/gi, '');
  // Remove  IBAN XXXX-5128 pattern 
  cleaned = cleaned.replaceAll(/\bIBAN\s+[A-Z0-9-]+\b/gi, '');
  // Remove any word longer than 9 characters (like SM30150819D502A1, MBMB00312189361905839, etc.)
  cleaned = cleaned.replaceAll(/\S{10,}/g, '');
  
  // Clean up whitespace
  cleaned = cleaned.replaceAll(/\s+/g, ' ').trim();
  
  return cleaned || 'Transaction';
}