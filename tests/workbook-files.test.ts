import test from 'node:test';
import assert from 'node:assert/strict';
import { commitPhotoFile } from '../src/workbook/file-commit.ts';

class DiskFile {
  exists = false; size = 0; failCopy = false; partial = false; failMove = false;
  delete() { this.exists = false; this.size = 0; }
  async copy(destination: DiskFile) {
    await new Promise<void>(resolve => setTimeout(resolve, 5));
    if (this.failCopy) throw new Error('copy failed');
    destination.exists = true; destination.size = this.partial ? this.size - 1 : this.size;
  }
  async move(destination: DiskFile) {
    await new Promise<void>(resolve => setTimeout(resolve, 5));
    if (this.failMove) throw new Error('move failed');
    destination.size = this.size; destination.exists = true; this.delete();
  }
}
test('Native photo commit waits for asynchronous copy and move before returning metadata', async () => {
  const source = new DiskFile(), temp = new DiskFile(), final = new DiskFile(); source.exists = true; source.size = 123456;
  const pending = commitPhotoFile(source, temp, final);
  assert.equal(final.exists, false);
  assert.equal(await pending, 123456); assert.equal(final.exists, true); assert.equal(temp.exists, false); assert.equal(source.exists, true);
});
test('A failed or partial copy cannot replace the previously saved photo', async () => {
  for (const failure of ['failCopy', 'partial'] as const) {
    const source = new DiskFile(), temp = new DiskFile(), final = new DiskFile(); source.exists = true; source.size = 100; source[failure] = true;
    final.exists = true; final.size = 50;
    await assert.rejects(commitPhotoFile(source, temp, final)); assert.equal(final.size, 50); assert.equal(final.exists, true);
  }
});
test('A failed move does not return photo metadata or delete the previous photo', async () => {
  const source = new DiskFile(), temp = new DiskFile(), final = new DiskFile(); source.exists = true; source.size = 100; temp.failMove = true;
  final.exists = true; final.size = 50;
  await assert.rejects(commitPhotoFile(source, temp, final)); assert.equal(final.size, 50); assert.equal(source.exists, true);
});
