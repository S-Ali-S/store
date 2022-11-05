import { Store } from '../src'
import { Post, schema, TypesMap, User } from './fixtures'
import { postFactory, userFactory } from './utils/factories'
import { Document } from '../src/types'
import { getDocumentKey, getDocumentType } from '../src/document'
import { toCollection } from './utils'

const store = new Store<TypesMap>({
  schema,
})

afterEach(() => store.reset())

it('can add a new document to the store', () => {
  const user = userFactory()
  store.add('User', user)

  expect(store.findFirstOrThrow('User')).toEqual(user)
})

it('should store document meta data on added document', () => {
  const user = store.add('User', userFactory()) as Document<User>

  expect(getDocumentKey(user)).toEqual(expect.any(String))
  expect(getDocumentType(user)).toEqual('User')

  const post = store.add('Post', postFactory()) as Document<Post>

  expect(getDocumentKey(post)).toEqual(expect.any(String))
  expect(getDocumentType(post)).toEqual('Post')
})

it('should store document meta data privately', () => {
  const data: User = {
    id: '7c280f0a-c1e7-4982-a008-99d9e1bcbea0',
    username: 'john.doe',
    posts: [],
    profile: {
      fullName: 'John Doe',
    },
  }

  const user = store.add('User', data)

  expect(user).toEqual(data)
  expect(user).toMatchInlineSnapshot(`
    {
      "id": "7c280f0a-c1e7-4982-a008-99d9e1bcbea0",
      "posts": [],
      "profile": {
        "fullName": "John Doe",
      },
      "username": "john.doe",
    }
  `)

  // @ts-expect-error DOCUMENT_KEY_SYMBOL should be hidden from return type
  expect(getDocumentKey(user)).toEqual(expect.any(String))
  // @ts-expect-error DOCUMENT_KEY_SYMBOL should be hidden from return type
  expect(getDocumentType(user)).toEqual('User')
})

it('can add new document with `one-to-one` `required` relation', () => {
  const data = userFactory()
  const user = store.add('User', data)

  expect(user.profile).toEqual(data.profile)
  expect(store.findFirstOrThrow('User').profile).toEqual(data.profile)
  expect(store.findFirstOrThrow('UserProfile')).toEqual(user.profile)
})

it('can add new document with `one-to-many` relation', () => {
  const data = userFactory({ posts: toCollection(postFactory, 3) })
  const user = store.add('User', data)

  expect(user.posts).toEqual(data.posts)
  expect(store.findFirstOrThrow('User').posts).toEqual(data.posts)

  expect(store.count('Post')).toEqual(3)
  expect(store.find('Post')).toEqual(user.posts)
})
