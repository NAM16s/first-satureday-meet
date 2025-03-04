
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, getKoreanMonthName, sortUsersByKoreanName } from '../utils/constants';
import { User } from '../utils/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const Members = () => {
  const { users } = useAuth();
  const { selectedYear, setSelectedYear, memberDues, updateDues, transactions } = useFinance();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState<number>(50000); // Default amount
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sort users by Korean name
  const sortedUsers = sortUsersByKoreanName(users);

  // Filter out admin users for the member list
  const memberUsers = sortedUsers.filter(user => 
    user.id !== 'admin' && !user.id.includes('admin')
  );

  // Get condolence expenses for selected user
  const getCondolenceExpenses = (userId: string) => {
    return transactions.filter(
      transaction => 
        transaction.userId === userId && 
        transaction.category === '경조사비' &&
        new Date(transaction.date).getFullYear() === selectedYear
    );
  };

  const handlePreviousYear = () => {
    setSelectedYear(selectedYear - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(selectedYear + 1);
  };

  const handlePayDues = (user: User, month: number) => {
    setSelectedUser(user);
    setSelectedMonth(month);
    setAmount(50000); // Default amount
    setIsDialogOpen(true);
  };

  const handleSubmitDues = () => {
    if (!selectedUser) return;
    
    updateDues(selectedUser.id, selectedMonth, amount);
    setIsDialogOpen(false);
  };

  // Check if a user has paid dues for a specific month
  const getDuesForMonth = (userId: string, month: number) => {
    const userDues = memberDues.find(dues => dues.userId === userId);
    return userDues ? userDues.duesByMonth[month] : 0;
  };

  // Get total unpaid amount for a user
  const getUnpaidAmount = (userId: string) => {
    const userDues = memberDues.find(dues => dues.userId === userId);
    return userDues ? userDues.unpaidAmount : 0;
  };

  // Get user by ID
  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId);
  };

  return (
    <Layout title="회원관리">
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

        <Tabs defaultValue="dues">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dues">회비 납부 현황</TabsTrigger>
            <TabsTrigger value="condolences">경조사비 지급 현황</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dues" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>회원 회비 납부 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">회원명</TableHead>
                        {Array.from({ length: 12 }, (_, i) => (
                          <TableHead key={i} className="text-center">
                            {getKoreanMonthName(i + 1)}
                          </TableHead>
                        ))}
                        <TableHead className="text-right">미납액</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          {Array.from({ length: 12 }, (_, i) => {
                            const month = i + 1;
                            const duesAmount = getDuesForMonth(user.id, month);
                            return (
                              <TableCell key={month} className="text-center">
                                {duesAmount > 0 ? (
                                  <div className="text-sm text-green-600 font-medium">
                                    {formatCurrency(duesAmount)}
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePayDues(user, month)}
                                  >
                                    입력
                                  </Button>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-right font-medium text-destructive">
                            {formatCurrency(getUnpaidAmount(user.id))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="condolences" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>경조사비 지급 현황</CardTitle>
              </CardHeader>
              <CardContent>
                {memberUsers.map((user) => {
                  const condolenceExpenses = getCondolenceExpenses(user.id);
                  
                  // Only show members who have received condolence expenses
                  if (condolenceExpenses.length === 0) return null;
                  
                  return (
                    <div key={user.id} className="mb-8 last:mb-0">
                      <h3 className="font-semibold text-lg mb-3">{user.name}</h3>
                      <div className="bg-accent rounded-md p-4">
                        {condolenceExpenses.length > 0 ? (
                          <ul className="space-y-3">
                            {condolenceExpenses.map((expense) => (
                              <li key={expense.id} className="flex justify-between">
                                <div>
                                  <span className="font-medium">{new Date(expense.date).toLocaleDateString('ko-KR')}</span>
                                  {expense.description && (
                                    <span className="text-sm text-muted-foreground ml-2">
                                      {expense.description}
                                    </span>
                                  )}
                                </div>
                                <span className="font-medium">{formatCurrency(expense.amount)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-center text-muted-foreground py-2">경조사비 지급 내역이 없습니다.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* If no one has received condolence expenses */}
                {memberUsers.every(user => getCondolenceExpenses(user.id).length === 0) && (
                  <p className="text-center text-muted-foreground py-4">경조사비 지급 내역이 없습니다.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog for paying dues */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>회비 납부 등록</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>회원명</Label>
              <div className="p-2 border rounded-md bg-accent">
                {selectedUser?.name}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>납부월</Label>
              <div className="p-2 border rounded-md bg-accent">
                {selectedYear}년 {selectedMonth}월
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">납부 금액</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={0}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSubmitDues}>
                등록
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Members;
