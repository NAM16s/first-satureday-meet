
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, getKoreanMonthName, sortUsersByKoreanName, EXPENSE_CATEGORIES } from '../utils/constants';
import { ChevronLeft, ChevronRight, Calendar, Plus, Pencil, Trash2 } from 'lucide-react';
import { Transaction } from '../utils/types';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Expenses = () => {
  const { users, currentUser } = useAuth();
  const { transactions, selectedYear, setSelectedYear, addTransaction, updateTransaction, deleteTransaction } = useFinance();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionData, setTransactionData] = useState({
    date: new Date().toISOString().split('T')[0],
    userId: '',
    category: EXPENSE_CATEGORIES[0],
    amount: 0,
    description: '',
  });
  
  // Filter expense transactions for the selected year
  const expenseTransactions = transactions.filter(
    transaction => 
      EXPENSE_CATEGORIES.includes(transaction.category) &&
      new Date(transaction.date).getFullYear() === selectedYear
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalExpense = expenseTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  // Check if user can edit/delete (admin or treasurer)
  const canModify = currentUser?.role === 'admin' || currentUser?.role === 'treasurer';

  const handlePreviousYear = () => {
    setSelectedYear(selectedYear - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(selectedYear + 1);
  };

  const handleAddNewExpense = () => {
    setSelectedTransaction(null);
    setTransactionData({
      date: new Date().toISOString().split('T')[0],
      userId: currentUser?.id || '',
      category: EXPENSE_CATEGORIES[0],
      amount: 0,
      description: '',
    });
    setIsDialogOpen(true);
  };

  const handleEditExpense = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionData({
      date: new Date(transaction.date).toISOString().split('T')[0],
      userId: transaction.userId,
      category: transaction.category,
      amount: transaction.amount,
      description: transaction.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteExpense = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitExpense = () => {
    if (selectedTransaction) {
      // Update existing transaction
      updateTransaction({
        ...selectedTransaction,
        date: new Date(transactionData.date).toISOString(),
        userId: transactionData.userId,
        category: transactionData.category,
        amount: transactionData.amount,
        description: transactionData.description,
      });
    } else {
      // Add new transaction
      addTransaction({
        date: new Date(transactionData.date).toISOString(),
        userId: transactionData.userId,
        category: transactionData.category,
        amount: transactionData.amount,
        description: transactionData.description,
      });
    }
    setIsDialogOpen(false);
  };

  const confirmDelete = () => {
    if (selectedTransaction) {
      deleteTransaction(selectedTransaction.id);
      setIsDeleteDialogOpen(false);
    }
  };

  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find(user => user.id === userId);
    return user ? user.name : userId;
  };

  // Format date to Korean format
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <Layout title="지출내역">
      <div className="space-y-6">
        {/* Year selector */}
        <div className="flex justify-center items-center mb-6">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePreviousYear}
            className="mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center px-4 py-2 bg-card border rounded-md">
            <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{selectedYear}년</span>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNextYear}
            className="ml-2"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{selectedYear}년 지출 총액: {formatCurrency(totalExpense)}</CardTitle>
            {canModify && (
              <Button onClick={handleAddNewExpense}>
                <Plus className="h-4 w-4 mr-2" />
                새로운 지출
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>회원명</TableHead>
                    <TableHead>항목</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                    <TableHead>설명</TableHead>
                    {canModify && (
                      <TableHead className="w-[100px] text-center">관리</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseTransactions.length > 0 ? (
                    expenseTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>{getUserName(transaction.userId)}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {transaction.description || '-'}
                        </TableCell>
                        {canModify && (
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditExpense(transaction)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteExpense(transaction)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={canModify ? 6 : 5} className="text-center py-10">
                        지출 내역이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog for adding/editing expense */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTransaction ? '지출 내역 수정' : '새로운 지출 등록'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">날짜</Label>
              <Input
                id="date"
                type="date"
                value={transactionData.date}
                onChange={(e) => setTransactionData({...transactionData, date: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="user">회원</Label>
              <Select
                value={transactionData.userId}
                onValueChange={(value) => setTransactionData({...transactionData, userId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="회원 선택" />
                </SelectTrigger>
                <SelectContent>
                  {sortUsersByKoreanName(users).map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">항목</Label>
              <Select
                value={transactionData.category}
                onValueChange={(value) => setTransactionData({...transactionData, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="항목 선택" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">금액</Label>
              <Input
                id="amount"
                type="number"
                value={transactionData.amount}
                onChange={(e) => setTransactionData({...transactionData, amount: Number(e.target.value)})}
                min={0}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택사항)</Label>
              <Textarea
                id="description"
                value={transactionData.description}
                onChange={(e) => setTransactionData({...transactionData, description: e.target.value})}
                placeholder="추가 설명 입력 (선택사항)"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSubmitExpense}>
                {selectedTransaction ? '수정' : '등록'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm delete dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>지출 내역 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 지출 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Expenses;
