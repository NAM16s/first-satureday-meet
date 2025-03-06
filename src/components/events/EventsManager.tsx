
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusCircle, Download, RotateCcw, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { databaseService } from '@/services/databaseService';
import { exportAsImage } from '@/utils/exportUtils';
import { EventHistory } from '@/utils/types';

interface EventsManagerProps {
  selectedYear: number;
  events: any[];
  onEventsChange: (events: any[]) => void;
}

export const EventsManager = ({ 
  selectedYear, 
  events, 
  onEventsChange 
}: EventsManagerProps) => {
  const eventsRef = useRef<HTMLDivElement>(null);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [expandedHistories, setExpandedHistories] = useState<string[]>([]);
  
  const [newEvent, setNewEvent] = useState({
    id: '',
    date: '',
    name: '',
    description: '',
  });
  
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventHistories, setEventHistories] = useState<EventHistory[]>([]);
  
  // Load event histories
  useState(() => {
    const loadEventHistories = async () => {
      try {
        const histories = await databaseService.getEventHistories();
        setEventHistories(histories);
      } catch (error) {
        console.error('Error loading event histories:', error);
      }
    };
    
    loadEventHistories();
  });
  
  const handleExportEvents = () => {
    if (eventsRef.current) {
      exportAsImage(eventsRef.current.id, `경조사비_${selectedYear}`);
      toast.success('이미지가 다운로드되었습니다.');
    }
  };
  
  const handleAddEvent = () => {
    if (!newEvent.date || !newEvent.name) {
      toast.error('날짜와 회원명은 필수입니다.');
      return;
    }
    
    const event = {
      ...newEvent,
      id: crypto.randomUUID(),
    };
    
    onEventsChange([...events, event]);
    setAddEventDialogOpen(false);
    setNewEvent({
      id: '',
      date: '',
      name: '',
      description: '',
    });
    
    toast.success('경조사비 지급 내역이 추가되었습니다.');
  };
  
  const handleEditEvent = () => {
    if (!editingEvent) return;
    
    onEventsChange(
      events.map(event => event.id === editingEvent.id ? editingEvent : event)
    );
    
    setEditEventDialogOpen(false);
    setEditingEvent(null);
    toast.success('경조사비 지급 내역이 수정되었습니다.');
  };
  
  const handleDeleteEvent = (id: string) => {
    onEventsChange(events.filter(event => event.id !== id));
    toast.success('경조사비 지급 내역이 삭제되었습니다.');
  };
  
  const handleStartEditEvent = (event: any) => {
    setEditingEvent({ ...event });
    setEditEventDialogOpen(true);
  };
  
  const handleResetEvents = async () => {
    try {
      // Create a new history entry
      const historyId = await databaseService.createEventHistory(selectedYear, events);
      
      // Clear current events
      onEventsChange([]);
      
      // Reload histories
      const histories = await databaseService.getEventHistories();
      setEventHistories(histories);
      
      setResetDialogOpen(false);
      toast.success('경조사비 지급 내역이 초기화되었습니다.');
    } catch (error) {
      console.error('Error resetting events:', error);
      toast.error('경조사비 지급 내역 초기화 중 오류가 발생했습니다.');
    }
  };
  
  const toggleHistoryExpansion = (id: string) => {
    setExpandedHistories(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>경조사비 지급 내역</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleExportEvents}>
                <Download className="mr-2 h-4 w-4" />
                내보내기
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddEventDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                추가
              </Button>
              <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    초기화
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>경조사비 지급 내역 초기화</AlertDialogTitle>
                    <AlertDialogDescription>
                      현재의 경조사비 지급 내역을 초기화하시겠습니까?<br />
                      기존 내역은 히스토리로 보관됩니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetEvents}>초기화</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div id="events-content" ref={eventsRef}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 text-left">날짜</th>
                    <th className="p-2 text-left">회원명</th>
                    <th className="p-2 text-left">내용</th>
                    <th className="p-2 text-right">금액</th>
                    <th className="p-2 text-center">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length > 0 ? (
                    events.map(event => (
                      <tr key={event.id} className="border-b">
                        <td className="p-2">{event.date}</td>
                        <td className="p-2">{event.name}</td>
                        <td className="p-2">{event.description}</td>
                        <td className="p-2 text-right">{event.amount ? event.amount.toLocaleString() + '원' : ''}</td>
                        <td className="p-2 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleStartEditEvent(event)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">수정</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">삭제</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>경조사비 지급 내역 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  정말로 이 내역을 삭제하시겠습니까?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteEvent(event.id)}>삭제</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        {selectedYear}년도의 경조사비 지급 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 히스토리 섹션 */}
      {eventHistories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">경조사비 지급 내역 히스토리</h3>
          {eventHistories.map(history => (
            <Card key={history.id} className="bg-slate-50">
              <CardHeader className="py-3">
                <Button 
                  variant="ghost" 
                  className="flex justify-between items-center w-full p-0 h-auto"
                  onClick={() => toggleHistoryExpansion(history.id)}
                >
                  <span className="font-medium">
                    {history.year}년 경조사비 내역 ({new Date(history.created_at).toLocaleDateString()})
                  </span>
                  {expandedHistories.includes(history.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              {expandedHistories.includes(history.id) && (
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 text-left">날짜</th>
                          <th className="p-2 text-left">회원명</th>
                          <th className="p-2 text-left">내용</th>
                          <th className="p-2 text-right">금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.events.length > 0 ? (
                          history.events.map((event: any, index: number) => (
                            <tr key={index} className="border-b">
                              <td className="p-2">{event.date}</td>
                              <td className="p-2">{event.name}</td>
                              <td className="p-2">{event.description}</td>
                              <td className="p-2 text-right">{event.amount ? event.amount.toLocaleString() + '원' : ''}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-muted-foreground">
                              내역이 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* 경조사비 추가 다이얼로그 */}
      <Dialog open={addEventDialogOpen} onOpenChange={setAddEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>경조사비 지급 내역 추가</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">날짜</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">회원명</Label>
                <Input
                  id="name"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">내용</Label>
              <Input
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">금액</Label>
              <Input
                id="amount"
                type="number"
                value={newEvent.amount || ''}
                onChange={(e) => setNewEvent(prev => ({ ...prev, amount: Number(e.target.value) }))}
                className="text-right"
                min={0}
                step={10000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddEventDialogOpen(false)}>취소</Button>
            <Button onClick={handleAddEvent}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 경조사비 수정 다이얼로그 */}
      <Dialog open={editEventDialogOpen} onOpenChange={setEditEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>경조사비 지급 내역 수정</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">날짜</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">회원명</Label>
                  <Input
                    id="edit-name"
                    value={editingEvent.name}
                    onChange={(e) => setEditingEvent(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">내용</Label>
                <Input
                  id="edit-description"
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-amount">금액</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={editingEvent.amount || ''}
                  onChange={(e) => setEditingEvent(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="text-right"
                  min={0}
                  step={10000}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEventDialogOpen(false)}>취소</Button>
            <Button onClick={handleEditEvent}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
