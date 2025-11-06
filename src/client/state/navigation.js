import EventEmitter from 'events';
import cons from './cons';

class Navigation extends EventEmitter {}

const navigation = new Navigation();

export const emitReviewTransferOpened = (transferData) => {
  navigation.emit(cons.events.navigation.REVIEW_TRANSFER_OPENED, transferData);
};

export default navigation;
